/**
 * hospitalService.js
 * -------------------
 * SuperAdmin & Multi-Hospital Operations Engine.
 * Manages Hospitals, Employees, Departments, Desks, Kiosks, and Database Overview.
 */

const prisma = require("../config/prisma");
const { hashPassword } = require("../utils/password");
const { getCurrentQueueDate, queueDateToPrismaDate } = require("../utils/timezone");

const STANDARD_DEPARTMENTS = [
  ["consultation", "General Consultation (OPD)", "General outpatient doctor examinations"],
  ["pharmacy", "Pharmacy & Medicine", "Prescription dispensing and clinical pharmacy"],
  ["laboratory", "Pathology & Lab Test", "Diagnostic blood, urine and pathology assays"],
  ["radiology", "Radiology & X-Ray", "X-Ray, CT Scan, MRI and ultrasound imaging"],
  ["emergency", "Emergency Triage", "Critical emergency resuscitation and trauma"],
  ["billing", "Central Billing & Cashier", "Hospital services billing, insurance and receipts"],
];

const DEFAULT_BRANDING = {
  logo_url: "",
  primary_color: "#0284C7",
  secondary_color: "#0369A1",
  accent_color: "#F0F9FF",
  tagline: "Care you can trust • NABH Accredited",
  emergency_helpline: "Emergency Helpline: 108 / +91 98765 43210",
  slip_footer_text: "Non-transferable official patient record. Please keep until consultation is complete.",
  opd_start_time: "08:00",
  opd_end_time: "20:00",
  registration_cutoff_time: "19:00",
  operating_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  closed_notice: "Registrations are closed for today. Please visit during OPD hours or book an appointment for tomorrow.",
};

/**
 * Super Admin Overview: aggregates platform or owner-scoped statistics.
 */
async function getSuperAdminOverview(requesterUser = null) {
  let ownerUid = null;
  if (requesterUser && ["superadmin", "super_admin", "hospital_owner"].includes((requesterUser.role || "").toLowerCase())) {
    ownerUid = requesterUser.id;
  }

  const todayStr = getCurrentQueueDate();
  const todayDateObj = queueDateToPrismaDate(todayStr);

  if (ownerUid) {
    const hospitals = await prisma.hospitals.findMany({
      where: { owner_user_id: ownerUid },
      select: { id: true, hospital_code: true, status: true },
    });

    const totalH = hospitals.length;
    const activeH = hospitals.filter((h) => h.status === "active").length;
    const hIds = hospitals.map((h) => h.id);

    if (hIds.length > 0) {
      const totalEmp = await prisma.employees.count({
        where: { hospital_id: { in: hIds }, status: "active" },
      });

      const activeDocs = await prisma.employees.count({
        where: {
          hospital_id: { in: hIds },
          status: "active",
          users: { role: { in: ["doctor", "admin"] } },
        },
      });

      const totalDesks = await prisma.desks.count({
        where: { hospital_id: { in: hIds } },
      });

      const activeDesks = await prisma.desks.count({
        where: {
          hospital_id: { in: hIds },
          status: { in: ["AVAILABLE", "OCCUPIED", "BUSY"] },
        },
      });

      const todayTickets = await prisma.tickets.count({
        where: {
          hospital_id: { in: hIds },
          queue_date: todayDateObj,
        },
      });

      const activeQueues = await prisma.tickets.count({
        where: {
          hospital_id: { in: hIds },
          status: { in: ["waiting", "called", "serving", "WAITING", "CALLED", "SERVING"] },
        },
      });

      const totalTickets = await prisma.tickets.count({
        where: { hospital_id: { in: hIds } },
      });

      const totalUsers = await prisma.users.count({
        where: {
          OR: [{ employees: { some: { hospital_id: { in: hIds } } } }, { id: ownerUid }],
        },
      });

      return {
        total_hospitals: totalH,
        active_hospitals: activeH,
        total_employees: totalEmp,
        active_doctors: activeDocs,
        total_desks: totalDesks,
        active_desks: activeDesks,
        patients_today: todayTickets,
        active_queues: activeQueues,
        total_users: totalUsers,
        total_tickets: totalTickets,
      };
    }

    return {
      total_hospitals: 0,
      active_hospitals: 0,
      total_employees: 0,
      active_doctors: 0,
      total_desks: 0,
      active_desks: 0,
      patients_today: 0,
      active_queues: 0,
      total_users: 1,
      total_tickets: 0,
    };
  }

  // Global aggregate
  const totalH = await prisma.hospitals.count();
  const activeH = await prisma.hospitals.count({ where: { status: "active" } });
  const totalEmp = await prisma.employees.count({ where: { status: "active" } });
  const activeDocs = await prisma.employees.count({
    where: {
      status: "active",
      users: { role: { in: ["doctor", "admin"] } },
    },
  });
  const totalDesks = await prisma.desks.count();
  const activeDesks = await prisma.desks.count({
    where: { status: { in: ["AVAILABLE", "OCCUPIED", "BUSY"] } },
  });
  const todayTickets = await prisma.tickets.count({
    where: { queue_date: todayDateObj },
  });
  const activeQueues = await prisma.tickets.count({
    where: { status: { in: ["waiting", "called", "serving", "WAITING", "CALLED", "SERVING"] } },
  });
  const totalTickets = await prisma.tickets.count();
  const totalUsers = await prisma.users.count();

  return {
    total_hospitals: totalH,
    active_hospitals: activeH,
    total_employees: totalEmp,
    active_doctors: activeDocs,
    total_desks: totalDesks,
    active_desks: activeDesks,
    patients_today: todayTickets,
    active_queues: activeQueues,
    total_users: totalUsers,
    total_tickets: totalTickets,
  };
}

/**
 * Lists hospitals scoped to user ownership or all hospitals for global admin.
 */
async function getAllHospitals(requesterUser = null) {
  if (requesterUser) {
    const role = (requesterUser.role || "").toLowerCase();
    if (role === "superadmin" || role === "super_admin" || role === "hospital_owner") {
      return prisma.hospitals.findMany({
        where: { owner_user_id: requesterUser.id },
        orderBy: { id: "asc" },
      });
    } else if (["admin", "doctor", "staff"].includes(role)) {
      return prisma.hospitals.findMany({
        where: { employees: { some: { user_id: requesterUser.id } } },
        orderBy: { id: "asc" },
      });
    }
  }

  return prisma.hospitals.findMany({
    orderBy: { id: "asc" },
  });
}

/**
 * Fetches hospital details by hospital_code.
 */
async function getHospitalByCode(hospitalCode) {
  return prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
    include: {
      departments: true,
      desks: true,
      kiosks: true,
    },
  });
}

/**
 * Creates a new hospital tenant and seeds standard departments.
 */
async function createHospital({
  hospitalCode,
  name,
  address = "",
  phone = "",
  email = "",
  description = "",
  logoUrl = "",
  status = "active",
  ownerUserId = null,
}) {
  const hCode = String(hospitalCode).trim();
  const hospital = await prisma.hospitals.create({
    data: {
      hospital_code: hCode,
      name,
      address,
      phone,
      email,
      description,
      logo_url: logoUrl,
      status,
      owner_user_id: ownerUserId,
    },
  });

  // Seed standard clinical departments
  for (const [dCode, dName, dDesc] of STANDARD_DEPARTMENTS) {
    await prisma.departments.upsert({
      where: {
        hospital_id_dept_code: {
          hospital_id: hospital.id,
          dept_code: dCode,
        },
      },
      create: {
        hospital_id: hospital.id,
        dept_code: dCode,
        name: dName,
        description: dDesc,
        status: "active",
      },
      update: {},
    });
  }

  // Log audit
  await prisma.audit_logs.create({
    data: {
      hospital_id: hospital.id,
      user_id: ownerUserId,
      action: "CREATE_HOSPITAL",
      entity_type: "hospital",
      entity_id: String(hospital.id),
      new_values: { code: hCode, name },
    },
  });

  return hospital;
}

/**
 * Updates hospital profile information.
 */
async function updateHospital(hospitalCode, data) {
  const hCode = String(hospitalCode).trim();
  const updateData = {
    name: data.name,
    address: data.address || "",
    phone: data.phone || "",
    email: data.email || "",
    description: data.description || "",
    logo_url: data.logo_url || "",
    status: data.status || "active",
    updated_at: new Date(),
  };
  if (data.branding_json !== undefined) {
    updateData.branding_json = data.branding_json;
  }
  return prisma.hospitals.update({
    where: { hospital_code: hCode },
    data: updateData,
  });
}

/**
 * Gets tenant branding, custom slip settings, and operating hours.
 */
async function getHospitalBranding(hospitalCode) {
  const hCode = String(hospitalCode).trim();
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: hCode },
    select: {
      id: true,
      hospital_code: true,
      name: true,
      logo_url: true,
      phone: true,
      email: true,
      address: true,
      description: true,
      branding_json: true,
      status: true,
    },
  });

  if (!hosp) {
    const err = new Error(`Hospital '${hCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const raw = hosp.branding_json || {};
  return {
    ...DEFAULT_BRANDING,
    ...raw,
    hospital_name: hosp.name,
    hospital_code: hosp.hospital_code,
    logo_url: raw.logo_url || hosp.logo_url || "",
    phone: hosp.phone || "",
    email: hosp.email || "",
    address: hosp.address || "",
    status: hosp.status || "active",
  };
}

/**
 * Updates tenant branding, token slip settings, and operating hours.
 */
async function updateHospitalBranding(hospitalCode, brandingData) {
  const hCode = String(hospitalCode).trim();
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: hCode },
  });

  if (!hosp) {
    const err = new Error(`Hospital '${hCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const existing = hosp.branding_json || {};
  const merged = {
    ...DEFAULT_BRANDING,
    ...existing,
    ...brandingData,
  };

  const updatePayload = {
    branding_json: merged,
    updated_at: new Date(),
  };

  if (brandingData.logo_url !== undefined) {
    updatePayload.logo_url = brandingData.logo_url;
  }

  const updatedHosp = await prisma.hospitals.update({
    where: { hospital_code: hCode },
    data: updatePayload,
  });

  return {
    status: "success",
    hospital_code: hCode,
    branding: {
      ...merged,
      hospital_name: updatedHosp.name,
      logo_url: updatedHosp.logo_url || merged.logo_url,
    },
  };
}

/**
 * Deletes hospital and safely cleans child entities.
 */
async function deleteHospital(hospitalCode) {
  const hCode = String(hospitalCode).trim();
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: hCode },
  });

  if (!hosp) {
    const err = new Error(`Hospital '${hCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const hId = hosp.id;

  // Safe cascaded removal
  await prisma.service_logs.deleteMany({ where: { hospital_id: hId } });
  await prisma.tickets.deleteMany({ where: { hospital_id: hId } });
  await prisma.appointments.deleteMany({ where: { hospital_id: hId } });
  await prisma.desks.deleteMany({ where: { hospital_id: hId } });
  await prisma.employees.deleteMany({ where: { hospital_id: hId } });
  await prisma.departments.deleteMany({ where: { hospital_id: hId } });
  await prisma.kiosks.deleteMany({ where: { hospital_id: hId } });
  await prisma.tenant_mapping.deleteMany({ where: { hospital_id: hId } });
  await prisma.tenant_config.deleteMany({ where: { hospital_id: hId } });
  await prisma.hospitals.delete({ where: { id: hId } });

  return { status: "success", message: `Hospital '${hosp.name}' (${hCode}) successfully deleted.` };
}

/**
 * Lists employees for a given hospital.
 */
async function getHospitalEmployees(hospitalCode) {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) return [];

  const employees = await prisma.employees.findMany({
    where: { hospital_id: hosp.id },
    include: {
      users: true,
      departments: true,
    },
    orderBy: { id: "asc" },
  });

  return employees.map((e) => ({
    id: e.id,
    employee_id_num: e.id,
    employee_id: e.employee_code || `EMP-${e.id}`,
    name: e.name,
    username: e.name || e.users?.username || "",
    email: e.users?.email || "",
    phone: e.phone || "",
    role: e.users?.role || "staff",
    department: e.departments?.dept_code || "all",
    department_name: e.departments?.name || "All Departments",
    status: e.status,
    user_id: e.user_id,
  }));
}

/**
 * Provisions a new hospital employee with dual login capability (email + employee_code).
 */
async function addHospitalEmployee({
  hospitalCode,
  name,
  email,
  role,
  department,
  employeeId = "",
  phone = "",
  password = "pass123",
}) {
  const cleanEmail = String(email).trim().toLowerCase();
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });

  if (!hosp) {
    const err = new Error(`Hospital '${hospitalCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const dept = await prisma.departments.findFirst({
    where: {
      hospital_id: hosp.id,
      dept_code: String(department || "consultation").trim().toLowerCase(),
    },
  });

  const pwdHash = await hashPassword(password);

  // 1. Create or resolve user
  let user = await prisma.users.findUnique({ where: { email: cleanEmail } });
  if (user) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: { role, phone, updated_at: new Date() },
    });
  } else {
    user = await prisma.users.create({
      data: {
        email: cleanEmail,
        username: name,
        password_hash: pwdHash,
        role,
        status: "active",
        phone,
      },
    });
  }

  const empCode = employeeId || `EMP-${user.id}`;

  // 2. Upsert employee
  const employee = await prisma.employees.upsert({
    where: {
      hospital_id_user_id: {
        hospital_id: hosp.id,
        user_id: user.id,
      },
    },
    create: {
      user_id: user.id,
      hospital_id: hosp.id,
      department_id: dept?.id || null,
      employee_code: empCode,
      name,
      phone,
      status: "active",
    },
    update: {
      department_id: dept?.id || null,
      name,
      phone,
      employee_code: empCode,
      status: "active",
      updated_at: new Date(),
    },
  });

  return {
    user_id: user.id,
    name,
    email: cleanEmail,
    role,
    department: department || "consultation",
    employee_id: empCode,
    status: "active",
  };
}

/**
 * Updates an employee's details, including optional password.
 */
async function updateHospitalEmployee(userId, { name, phone = "", role = "staff", department = "consultation", employeeId = "", status = "active", password = null }) {
  let uid = parseInt(userId, 10);
  let user = await prisma.users.findUnique({ where: { id: uid } });
  if (!user) {
    const empLookup = await prisma.employees.findUnique({ where: { id: uid } });
    if (empLookup && empLookup.user_id) {
      uid = empLookup.user_id;
      user = await prisma.users.findUnique({ where: { id: uid } });
    }
  }

  const userData = { username: name, role, phone, status, updated_at: new Date() };
  if (password && String(password).trim().length > 0) {
    userData.password_hash = await hashPassword(String(password).trim());
  }

  if (user) {
    await prisma.users.update({
      where: { id: uid },
      data: userData,
    });
  }

  const emp = await prisma.employees.findFirst({
    where: { user_id: uid },
  });

  if (emp) {
    const dept = await prisma.departments.findFirst({
      where: {
        hospital_id: emp.hospital_id,
        dept_code: String(department).trim().toLowerCase(),
      },
    });

    await prisma.employees.update({
      where: { id: emp.id },
      data: {
        name,
        phone,
        department_id: dept?.id || null,
        employee_code: employeeId || emp.employee_code,
        status,
        updated_at: new Date(),
      },
    });
  }

  return { user_id: uid, name, role, status };
}

/**
 * Updates an employee or doctor's password directly.
 */
async function updateEmployeePassword(userId, newPassword) {
  let uid = parseInt(userId, 10);
  let user = await prisma.users.findUnique({ where: { id: uid } });
  if (!user) {
    const empLookup = await prisma.employees.findUnique({ where: { id: uid } });
    if (empLookup && empLookup.user_id) {
      uid = empLookup.user_id;
      user = await prisma.users.findUnique({ where: { id: uid } });
    }
  }

  if (!user) {
    const err = new Error(`User or Employee #${userId} not found.`);
    err.status = 404;
    throw err;
  }

  const pwdHash = await hashPassword(String(newPassword).trim());
  await prisma.users.update({
    where: { id: uid },
    data: { password_hash: pwdHash, updated_at: new Date() },
  });

  return {
    user_id: uid,
    email: user.email,
    name: user.username,
    role: user.role,
    status: "success",
  };
}

/**
 * Deactivates an employee account.
 */
async function deleteHospitalEmployee(userId) {
  const uid = parseInt(userId, 10);
  await prisma.employees.deleteMany({ where: { user_id: uid } });
  await prisma.users.update({
    where: { id: uid },
    data: { status: "inactive", updated_at: new Date() },
  });
  return { success: true, deleted_user_id: uid };
}

/**
 * Departments Management
 */
async function getHospitalDepartments(hospitalCode) {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) return [];

  return prisma.departments.findMany({
    where: { hospital_id: hosp.id },
    orderBy: { id: "asc" },
  });
}

async function addHospitalDepartment(hospitalCode, deptCode, name, description = "") {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) {
    const err = new Error(`Hospital '${hospitalCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const dCode = String(deptCode).trim().toLowerCase();
  return prisma.departments.upsert({
    where: {
      hospital_id_dept_code: {
        hospital_id: hosp.id,
        dept_code: dCode,
      },
    },
    create: {
      hospital_id: hosp.id,
      dept_code: dCode,
      name,
      description,
      status: "active",
    },
    update: {
      name,
      description,
      updated_at: new Date(),
    },
  });
}

async function deleteHospitalDepartment(hospitalCode, deptCode) {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) return { success: false };

  await prisma.departments.deleteMany({
    where: {
      hospital_id: hosp.id,
      dept_code: String(deptCode).trim().toLowerCase(),
    },
  });

  return { success: true, deleted_dept: deptCode };
}

/**
 * Desks Management
 */
async function getHospitalDesks(hospitalCode) {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) return [];

  const rows = await prisma.desks.findMany({
    where: { hospital_id: hosp.id },
    include: {
      departments: true,
      employees: true,
    },
    orderBy: { desk_number: "asc" },
  });

  return rows.map((d) => ({
    id: d.id,
    desk_number: d.desk_number,
    desk_name: d.desk_name,
    status: d.status,
    current_ticket_id: d.current_ticket_id,
    last_active_at: d.last_active_at ? d.last_active_at.toISOString() : null,
    dept_code: d.departments?.dept_code || "",
    department_name: d.departments?.name || "",
    assigned_employee_name: d.employees?.name || null,
  }));
}

async function addHospitalDesk(hospitalCode, deptCode, deskName, status = "AVAILABLE") {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) {
    const err = new Error(`Hospital '${hospitalCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const dept = await prisma.departments.findFirst({
    where: {
      hospital_id: hosp.id,
      dept_code: String(deptCode).trim().toLowerCase(),
    },
  });

  const maxDesk = await prisma.desks.aggregate({
    where: { hospital_id: hosp.id, department_id: dept?.id },
    _max: { desk_number: true },
  });
  const deskNum = (maxDesk._max.desk_number || 0) + 1;

  return prisma.desks.create({
    data: {
      hospital_id: hosp.id,
      department_id: dept?.id || 1,
      desk_number: deskNum,
      desk_name: deskName,
      status: status || "AVAILABLE",
    },
  });
}

async function deleteHospitalDesk(deskId) {
  await prisma.desks.delete({ where: { id: parseInt(deskId, 10) } });
  return { success: true, deleted_desk_id: deskId };
}

async function updateDeskStatus(deskId, status) {
  return prisma.desks.update({
    where: { id: parseInt(deskId, 10) },
    data: {
      status,
      last_active_at: new Date(),
      updated_at: new Date(),
    },
  });
}

/**
 * Dynamic Database Inspector for Admin Portal.
 */
async function getDatabaseOverview() {
  const tables = [
    "users", "hospitals", "departments", "patients", "family_members",
    "employees", "desks", "kiosks", "appointments", "appointment_status_history",
    "tickets", "queue_events", "service_logs", "tenant_historical_data",
    "tenant_config", "tenant_mapping", "audit_logs"
  ];

  const result = {};

  for (const tbl of tables) {
    try {
      const countRes = await prisma.$queryRawUnsafe(`SELECT count(*)::int as cnt FROM ${tbl};`);
      const cnt = countRes[0]?.cnt || 0;

      const schemaRows = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${tbl}'
        ORDER BY ordinal_position ASC;
      `);

      const previewQuery =
        tbl !== "tenant_config" && tbl !== "tenant_mapping" && tbl !== "family_members"
          ? `SELECT * FROM ${tbl} ORDER BY id DESC LIMIT 5;`
          : `SELECT * FROM ${tbl} LIMIT 5;`;

      const rows = await prisma.$queryRawUnsafe(previewQuery);

      const sanitizedRows = rows.map((r) => {
        const copy = { ...r };
        if (copy.password_hash) {
          copy.password_hash = "•••••••••••• [ENCRYPTED]";
        }
        return copy;
      });

      result[tbl] = {
        count: cnt,
        schema: schemaRows.map((s) => ({
          name: s.column_name,
          type: s.data_type,
          nullable: s.is_nullable,
        })),
        rows: sanitizedRows,
      };
    } catch (e) {
      result[tbl] = { count: 0, schema: [], rows: [], error: e.message };
    }
  }

  return result;
}

module.exports = {
  getSuperAdminOverview,
  getAllHospitals,
  getHospitalByCode,
  createHospital,
  updateHospital,
  getHospitalBranding,
  updateHospitalBranding,
  deleteHospital,
  getHospitalEmployees,
  addHospitalEmployee,
  updateHospitalEmployee,
  updateEmployeePassword,
  deleteHospitalEmployee,
  getHospitalDepartments,
  addHospitalDepartment,
  deleteHospitalDepartment,
  getHospitalDesks,
  addHospitalDesk,
  deleteHospitalDesk,
  updateDeskStatus,
  getDatabaseOverview,
};
