/**
 * utils/seedKiosks.js
 * -------------------
 * Seeds default Kiosk terminals for registered hospitals if none exist.
 */

const prisma = require("../config/prisma");

async function seedDefaultKiosks() {
  try {
    const hospitals = await prisma.hospitals.findMany({
      where: { status: "active" },
      include: {
        departments: true,
        kiosks: true,
      },
    });

    for (const hosp of hospitals) {
      if (!hosp.kiosks || hosp.kiosks.length === 0) {
        // Find consultation / OPD department if available
        const opdDept = hosp.departments.find(
          (d) =>
            d.dept_code.toLowerCase().includes("consult") ||
            d.dept_code.toLowerCase().includes("opd") ||
            d.name.toLowerCase().includes("consult")
        );

        // Seed K-01: Main Entrance Check-in & Queue Terminal
        await prisma.kiosks.upsert({
          where: {
            hospital_id_kiosk_code: {
              hospital_id: hosp.id,
              kiosk_code: "K-01",
            },
          },
          create: {
            hospital_id: hosp.id,
            kiosk_code: "K-01",
            name: `${hosp.name} - Main Entrance Kiosk`,
            location: "Ground Floor Main Lobby",
            status: "online",
            last_seen_at: new Date(),
            is_active: true,
            department_id: null, // Central / All Departments
          },
          update: {},
        });

        // Seed K-02: OPD Waiting Area TV Monitor
        await prisma.kiosks.upsert({
          where: {
            hospital_id_kiosk_code: {
              hospital_id: hosp.id,
              kiosk_code: "K-02",
            },
          },
          create: {
            hospital_id: hosp.id,
            kiosk_code: "K-02",
            name: `${hosp.name} - OPD Waiting Display`,
            location: "1st Floor OPD Waiting Lounge",
            status: "online",
            last_seen_at: new Date(),
            is_active: true,
            department_id: opdDept ? opdDept.id : null,
          },
          update: {},
        });

        console.log(`[Kiosk Seed] Initialized default K-01 and K-02 kiosks for hospital '${hosp.hospital_code}'.`);
      }
    }
  } catch (err) {
    console.warn(`[Kiosk Seed Warning] ${err.message}`);
  }
}

module.exports = { seedDefaultKiosks };
