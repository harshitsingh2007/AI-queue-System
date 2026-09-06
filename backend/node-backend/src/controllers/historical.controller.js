/**
 * historical.controller.js
 * ------------------------
 * Historical Data Ingestion, Preview & Multi-Tenant Model Training.
 */

const prisma = require("../config/prisma");
const engine = require("../services/queueEngine");
const { triggerModelRetrain, getModelStatus } = require("../services/aiService");
const { getIo, broadcastQueueUpdate } = require("../socket");
const env = require("../config/env");
const { queueDateToPrismaDate, parseQueueDate } = require("../utils/timezone");

const MIN_TRAINING_ROWS = 500;

async function previewHistoricalDataEndpoint(req, res, next) {
  try {
    const aiUrl = env.AI_SERVICE_URL || "http://localhost:8001";
    // Forward the multipart request to Python AI service
    const fetchResponse = await fetch(`${aiUrl}/preview-historical`, {
      method: "POST",
      body: req.body, // or forwarded headers
      headers: { ...req.headers, host: undefined },
    });

    if (!fetchResponse.ok) {
      const err = await fetchResponse.json();
      return res.status(fetchResponse.status).json(err);
    }

    const data = await fetchResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    // If Python service is offline, return informative response
    return res.status(500).json({
      status: "error",
      message: `AI service preview failed: ${error.message}`,
    });
  }
}

async function uploadHistoricalDataEndpoint(req, res, next) {
  try {
    const aiUrl = env.AI_SERVICE_URL || "http://localhost:8001";
    const fetchResponse = await fetch(`${aiUrl}/validate-historical`, {
      method: "POST",
      body: req.body,
      headers: { ...req.headers, host: undefined },
    });

    const valResult = await fetchResponse.json();
    if (!fetchResponse.ok || !valResult.success) {
      return res.status(400).json(valResult);
    }

    const tenantId = valResult.tenant_id || "city-hospital-01";
    const hid = await engine.resolveHospitalId(tenantId);
    const records = valResult.records || [];

    // Batch insert into tenant_historical_data
    if (records.length > 0) {
      const batch = records.map((r) => ({
        hospital_id: hid,
        legacy_tenant_id: tenantId,
        consumer_type: r.consumer_type || "hospital",
        queue_date: queueDateToPrismaDate(r.queue_date || getCurrentQueueDate()),
        queue_length: parseInt(r.queue_length, 10) || 1,
        active_staff_counters: parseInt(r.active_staff_counters, 10) || 2,
        service_category: String(r.service_category || "consultation"),
        service_duration_minutes: parseFloat(r.service_duration_minutes) || 12.0,
        complexity_score: parseFloat(r.complexity_score) || 1.0,
        hour_of_day: parseInt(r.hour_of_day, 10) || 12,
        day_of_week: parseInt(r.day_of_week, 10) || 1,
        is_peak_hour: parseInt(r.is_peak_hour, 10) || 0,
      }));

      await prisma.tenant_historical_data.createMany({
        data: batch,
      });
    }

    const totalStored = await prisma.tenant_historical_data.count({
      where: { hospital_id: hid },
    });

    const minMet = totalStored >= MIN_TRAINING_ROWS;

    return res.status(200).json({
      success: true,
      tenant_id: tenantId,
      imported_records: records.length,
      total_stored_records: totalStored,
      rejected_records: valResult.rejected_rows || 0,
      warnings: valResult.warnings || [],
      min_threshold_met: minMet,
      min_required_rows: MIN_TRAINING_ROWS,
      message: `Successfully imported ${records.length} valid records into historical database. Total stored: ${totalStored} records.`,
    });
  } catch (error) {
    next(error);
  }
}

async function trainModelEndpoint(req, res, next) {
  try {
    const tenantId = req.body?.tenant_id || "global";
    const hid = await engine.resolveHospitalId(tenantId);

    // Fetch existing historical data + service logs from PostgreSQL
    const histRows = await prisma.tenant_historical_data.findMany({
      where: { hospital_id: hid },
      select: {
        consumer_type: true,
        service_category: true,
        queue_length: true,
        active_staff_counters: true,
        service_duration_minutes: true,
        complexity_score: true,
        hour_of_day: true,
        day_of_week: true,
        is_peak_hour: true,
      },
    });

    const logRows = await prisma.service_logs.findMany({
      where: { hospital_id: hid },
      select: {
        consumer_type: true,
        service_category: true,
        queue_length: true,
        active_staff_counters: true,
        service_duration_minutes: true,
        complexity_score: true,
        hour_of_day: true,
        day_of_week: true,
        is_peak_hour: true,
      },
    });

    const combined = [...histRows, ...logRows];
    const meta = await triggerModelRetrain(
      tenantId,
      combined.length > 0 ? combined : null,
      combined.length > 0 ? "historical_upload" : "synthetic"
    );

    const io = getIo();
    if (io) {
      await broadcastQueueUpdate(io, tenantId);
    }

    return res.status(200).json({
      status: "success",
      message: `Successfully trained model for tenant '${tenantId}'`,
      metrics: meta,
      ...meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getModelStatusEndpoint(req, res, next) {
  try {
    const tenantId = req.params.tenant_id || "global";
    const status = await getModelStatus(tenantId);
    return res.status(200).json(status);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  previewHistoricalDataEndpoint,
  uploadHistoricalDataEndpoint,
  trainModelEndpoint,
  getModelStatusEndpoint,
};
