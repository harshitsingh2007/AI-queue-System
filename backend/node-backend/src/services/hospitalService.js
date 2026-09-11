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
  const primaryCode = requesterUser?.primary_hospital_code || null;
  const role = requesterUser ? (requesterUser.role || "").toLowerCase() : "";
  if (role === "hospital_owner" || role === "superadmin" || role === "super_admin") {
    if (requesterUser.email !== "superadmin@hospital.com" && !requesterUser.is_superadmin) {
      ownerUid = requesterUser.id;
    }
  }

  const todayStr = getCurrentQueueDate();
  const todayDateObj = queueDateToPrismaDate(todayStr);

  if (ownerUid) {
    const hospitals = await prisma.hospitals.findMany({
      where: {
        OR: [
          { owner_user_id: ownerUid },
          ...(primaryCode ? [{ hospital_code: primaryCode }] : []),
          { employees: { some: { user_id: ownerUid } } },
        ],
      },
      select: { id: true, hospital_code: true, status: true },
    });

    const totalH = hospitals.length;
    const activeH = hospitals.filter((h) => h.status === "active").length;
    const hIds = hospitals.map((h) => h.id);
    if (hIds.length > 0) {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const totalEmp = await prisma.employees.count({
        where: {
          hospital_id: { in: hIds },
          status: { notIn: ["deactivated", "suspended", "blocked"] },
        },
      });

      const activeDocs = await prisma.employees.count({
        where: {
          hospital_id: { in: hIds },
          status: "active",
          users: {
            role: { in: ["doctor", "admin"] },
            last_login_at: { gte: twelveHoursAgo },
          },
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
  const twelveHoursAgoGlobal = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const totalEmp = await prisma.employees.count({
    where: { status: { notIn: ["deactivated", "suspended", "blocked"] } },
  });
  const activeDocs = await prisma.employees.count({
    where: {
      status: "active",
      users: {
        role: { in: ["doctor", "admin"] },
        last_login_at: { gte: twelveHoursAgoGlobal },
      },
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
    if (requesterUser.email === "superadmin@hospital.com" || requesterUser.is_superadmin) {
      return prisma.hospitals.findMany({
        orderBy: { id: "asc" },
      });
    }

    const primaryCode = requesterUser.primary_hospital_code || null;

    if (role === "hospital_owner" || role === "superadmin" || role === "super_admin") {
      const owned = await prisma.hospitals.findMany({
        where: {
          OR: [
            { owner_user_id: requesterUser.id },
            ...(primaryCode ? [{ hospital_code: primaryCode }] : []),
            { employees: { some: { user_id: requesterUser.id } } },
          ],
        },
        orderBy: { id: "asc" },
      });
      if (owned.length > 0) {
        return owned;
      }
    } else if (["admin", "doctor", "staff"].includes(role)) {
      return prisma.hospitals.findMany({
        where: {
          OR: [
            { employees: { some: { user_id: requesterUser.id } } },
            ...(primaryCode ? [{ hospital_code: primaryCode }] : []),
          ],
        },
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
  if (brandingData.hospital_name && brandingData.hospital_name.trim()) {
    updatePayload.name = brandingData.hospital_name.trim();
  } else if (brandingData.name && brandingData.name.trim()) {
    updatePayload.name = brandingData.name.trim();
  }
  if (brandingData.emergency_helpline && brandingData.emergency_helpline.trim()) {
    updatePayload.phone = brandingData.emergency_helpline.trim();
  } else if (brandingData.phone && brandingData.phone.trim()) {
    updatePayload.phone = brandingData.phone.trim();
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
      phone: updatedHosp.phone || merged.emergency_helpline,
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

  const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours max session window
  const now = Date.now();

  return employees.map((e) => {
    const lastLoginTime = e.users?.last_login_at ? new Date(e.users.last_login_at).getTime() : null;
    const isStale = !lastLoginTime || (now - lastLoginTime > SESSION_MAX_AGE_MS);
    const effectiveStatus = (e.status === "active" && e.users?.status === "active" && !isStale) ? "active" : "inactive";

    return {
      id: e.user_id,
      employee_id_num: e.id,
      employee_id: e.employee_code || `EMP-${e.id}`,
      name: e.name,
      username: e.name || e.users?.username || "",
      email: e.email || e.users?.email || "",
      phone: e.phone || "",
      role: e.users?.role || "staff",
      department: e.departments?.dept_code || "all",
      department_name: e.departments?.name || "All Departments",
      status: effectiveStatus,
      last_login_at: e.users?.last_login_at ? e.users.last_login_at.toISOString() : null,
      user_id: e.user_id,
    };
  });
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
        status: "inactive",
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
      email: cleanEmail,
      phone,
      status: "inactive",
    },
    update: {
      department_id: dept?.id || null,
      name,
      email: cleanEmail,
      phone,
      employee_code: empCode,
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
    status: employee.status || "inactive",
  };
}

/**
 * Updates an employee's details, including optional password.
 */
async function updateHospitalEmployee(userId, updateData = {}) {
  let uid = parseInt(userId, 10);
  let emp = await prisma.employees.findUnique({ where: { id: uid } });
  let user = null;

  if (emp) {
    uid = emp.user_id;
    user = await prisma.users.findUnique({ where: { id: uid } });
  } else {
    user = await prisma.users.findUnique({ where: { id: uid } });
    if (user) {
      emp = await prisma.employees.findFirst({ where: { user_id: uid } });
    }
  }

  const {
    name,
    email,
    phone,
    role,
    department,
    employeeId,
    status,
    password,
  } = updateData;

  const cleanEmail = email !== undefined && email !== null ? String(email).trim().toLowerCase() : undefined;
  const targetName = name !== undefined ? name : (emp?.name || user?.username || "");
  const targetRole = role !== undefined ? role : (user?.role || "staff");
  const targetStatus = status !== undefined ? status : (emp?.status || user?.status || "active");
  const targetPhone = phone !== undefined ? phone : (emp?.phone || user?.phone || "");

  const userData = {
    username: targetName,
    role: targetRole,
    phone: targetPhone,
    status: targetStatus,
    updated_at: new Date(),
  };
  if (targetStatus === "active") {
    userData.last_login_at = new Date();
  }
  if (cleanEmail) {
    userData.email = cleanEmail;
  }
  if (password && String(password).trim().length > 0) {
    userData.password_hash = await hashPassword(String(password).trim());
  }

  if (user) {
    await prisma.users.update({
      where: { id: uid },
      data: userData,
    });
  }

  if (emp) {
    let deptId = emp.department_id;
    if (department !== undefined) {
      const dept = await prisma.departments.findFirst({
        where: {
          hospital_id: emp.hospital_id,
          dept_code: String(department).trim().toLowerCase(),
        },
      });
      deptId = dept?.id || null;
    }

    const empData = {
      name: targetName,
      phone: targetPhone,
      department_id: deptId,
      employee_code: employeeId !== undefined ? employeeId : emp.employee_code,
      status: targetStatus,
      updated_at: new Date(),
    };
    if (cleanEmail) {
      empData.email = cleanEmail;
    }

    await prisma.employees.update({
      where: { id: emp.id },
      data: empData,
    });
  }

  return { user_id: uid, name: targetName, email: cleanEmail || user?.email || "", role: targetRole, status: targetStatus };
}

/**
 * Updates an employee or doctor's password directly.
 */
async function updateEmployeePassword(userId, newPassword) {
  let uid = parseInt(userId, 10);
  const empLookup = await prisma.employees.findUnique({ where: { id: uid } });
  let user = null;
  if (empLookup && empLookup.user_id) {
    uid = empLookup.user_id;
    user = await prisma.users.findUnique({ where: { id: uid } });
  } else {
    user = await prisma.users.findUnique({ where: { id: uid } });
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
  let uid = parseInt(userId, 10);
  const emp = await prisma.employees.findUnique({ where: { id: uid } });
  if (emp && emp.user_id) {
    uid = emp.user_id;
  }
  await prisma.employees.deleteMany({ where: { user_id: uid } });
  await prisma.users.update({
    where: { id: uid },
    data: { status: "deactivated", updated_at: new Date() },
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

async function updateHospitalDepartment(hospitalCode, deptCode, name, description) {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) {
    const err = new Error(`Hospital '${hospitalCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const dept = await prisma.departments.findFirst({
    where: { hospital_id: hosp.id, dept_code: String(deptCode).trim().toLowerCase() },
  });
  if (!dept) {
    const err = new Error(`Department '${deptCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const updated = await prisma.departments.update({
    where: { id: dept.id },
    data: {
      name: name || dept.name,
      description: description !== undefined ? description : dept.description,
      updated_at: new Date(),
    },
  });

  return updated;
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
      employees: {
        include: {
          users: true,
        },
      },
    },
    orderBy: { desk_number: "asc" },
  });

  const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
  const now = Date.now();

  return rows.map((d) => {
    const lastLoginTime = d.employees?.users?.last_login_at ? new Date(d.employees.users.last_login_at).getTime() : null;
    const isStale = !lastLoginTime || (now - lastLoginTime > SESSION_MAX_AGE_MS);
    const empStatus = (d.employees?.status === "active" && d.employees?.users?.status === "active" && !isStale) ? "active" : "inactive";

    return {
      id: d.id,
      desk_number: d.desk_number,
      desk_name: d.desk_name,
      status: d.status,
      current_ticket_id: d.current_ticket_id,
      last_active_at: d.last_active_at ? d.last_active_at.toISOString() : null,
      dept_code: d.departments?.dept_code || "",
      department_name: d.departments?.name || "",
      assigned_employee_id: d.assigned_employee_id,
      assigned_user_id: d.employees?.user_id || null,
      assigned_employee_name: d.employees?.name || null,
      assigned_employee_code: d.employees?.employee_code || null,
      assigned_employee_role: d.employees?.users?.role || null,
      assigned_employee_status: empStatus,
      assigned_employee_last_login: d.employees?.users?.last_login_at ? d.employees.users.last_login_at.toISOString() : null,
    };
  });
}

async function addHospitalDesk(hospitalCode, deptCode, deskName, status = "AVAILABLE", assignedEmployeeId = null) {
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

  let empId = assignedEmployeeId ? parseInt(assignedEmployeeId, 10) : null;
  if (empId) {
    const empRec = await prisma.employees.findFirst({
      where: { hospital_id: hosp.id, OR: [{ id: empId }, { user_id: empId }] },
      include: { users: true },
    });
    if (!empRec) {
      const crossEmp = await prisma.employees.findFirst({
        where: { OR: [{ id: empId }, { user_id: empId }] },
        include: { hospitals: true },
      });
      if (crossEmp) {
        const err = new Error(
          `Hospital Isolation Violation: Employee '${crossEmp.name}' belongs to hospital '${crossEmp.hospitals?.name || crossEmp.hospital_id}', not '${hospitalCode}'. Cross-hospital desk assignment is strictly prohibited.`
        );
        err.status = 403;
        err.code = "HOSPITAL_ISOLATION_VIOLATION";
        throw err;
      }
      const err = new Error(`Employee #${empId} not found in hospital '${hospitalCode}'.`);
      err.status = 404;
      err.code = "EMPLOYEE_NOT_FOUND";
      throw err;
    }

    // Availability enforcement
    const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
    const lastLogin = empRec.users?.last_login_at ? new Date(empRec.users.last_login_at).getTime() : null;
    const isStale = !lastLogin || (Date.now() - lastLogin > SESSION_MAX_AGE_MS);
    const isOnline = empRec.status === "active" && empRec.users?.status === "active" && !isStale;

    if (!isOnline) {
      const err = new Error(
        `Cannot assign desk: Doctor/Staff '${empRec.name}' is currently INACTIVE / OFFLINE. An employee must be actively logged in before being assigned to an active desk.`
      );
      err.status = 409;
      err.code = "EMPLOYEE_INACTIVE";
      throw err;
    }

    empId = empRec.id;

    await prisma.desks.updateMany({
      where: { hospital_id: hosp.id, assigned_employee_id: empId },
      data: { assigned_employee_id: null },
    });
  }

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
      assigned_employee_id: empId,
      status: status || "AVAILABLE",
    },
  });
}

async function assignHospitalDesk(hospitalCode, deskId, employeeId) {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) {
    const err = new Error(`Hospital '${hospitalCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const dId = parseInt(deskId, 10);
  let empId = employeeId ? parseInt(employeeId, 10) : null;

  if (empId) {
    const empRec = await prisma.employees.findFirst({
      where: { hospital_id: hosp.id, OR: [{ id: empId }, { user_id: empId }] },
      include: { users: true },
    });
    if (!empRec) {
      const crossEmp = await prisma.employees.findFirst({
        where: { OR: [{ id: empId }, { user_id: empId }] },
        include: { hospitals: true },
      });
      if (crossEmp) {
        const err = new Error(
          `Hospital Isolation Violation: Employee '${crossEmp.name}' belongs to hospital '${crossEmp.hospitals?.name || crossEmp.hospital_id}', not '${hospitalCode}'. Cross-hospital desk assignment is strictly prohibited.`
        );
        err.status = 403;
        err.code = "HOSPITAL_ISOLATION_VIOLATION";
        throw err;
      }
      const err = new Error(`Employee #${employeeId} not found in hospital '${hospitalCode}'.`);
      err.status = 404;
      err.code = "EMPLOYEE_NOT_FOUND";
      throw err;
    }

    // Availability enforcement
    const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
    const lastLogin = empRec.users?.last_login_at ? new Date(empRec.users.last_login_at).getTime() : null;
    const isStale = !lastLogin || (Date.now() - lastLogin > SESSION_MAX_AGE_MS);
    const isOnline = empRec.status === "active" && empRec.users?.status === "active" && !isStale;

    if (!isOnline) {
      const err = new Error(
        `Cannot assign desk: Doctor/Staff '${empRec.name}' is currently INACTIVE / OFFLINE. An employee must be actively logged in before being assigned to an active desk.`
      );
      err.status = 409;
      err.code = "EMPLOYEE_INACTIVE";
      throw err;
    }

    empId = empRec.id;

    // Clear any previous desk assigned to this employee
    await prisma.desks.updateMany({
      where: { hospital_id: hosp.id, assigned_employee_id: empId, NOT: { id: dId } },
      data: { assigned_employee_id: null },
    });
  }

  const updated = await prisma.desks.update({
    where: { id: dId },
    data: {
      assigned_employee_id: empId,
      updated_at: new Date(),
    },
    include: {
      departments: true,
      employees: {
        include: { users: true },
      },
    },
  });

  return {
    id: updated.id,
    desk_number: updated.desk_number,
    desk_name: updated.desk_name,
    status: updated.status,
    dept_code: updated.departments?.dept_code || "",
    department_name: updated.departments?.name || "",
    assigned_employee_id: updated.assigned_employee_id,
    assigned_employee_name: updated.employees?.name || null,
    assigned_employee_role: updated.employees?.users?.role || null,
  };
}

async function updateHospitalDesk(hospitalCode, deskId, deskName, deptCode, assignedEmployeeId = -1) {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) {
    const err = new Error(`Hospital '${hospitalCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const dId = parseInt(deskId, 10);
  const oldDesk = await prisma.desks.findUnique({
    where: { id: dId },
    include: { departments: true },
  });
  if (!oldDesk || oldDesk.hospital_id !== hosp.id) {
    const err = new Error(`Desk #${deskId} not found in hospital '${hospitalCode}'.`);
    err.status = 404;
    throw err;
  }

  let targetDeptId = oldDesk.department_id;
  if (deptCode) {
    const dept = await prisma.departments.findFirst({
      where: { hospital_id: hosp.id, dept_code: String(deptCode).trim().toLowerCase() },
    });
    if (dept) {
      targetDeptId = dept.id;
    }
  }

  const targetName = deskName && deskName.trim() !== "" ? deskName.trim() : oldDesk.desk_name;

  let targetEmpId = oldDesk.assigned_employee_id;
  if (assignedEmployeeId !== -1) {
    if (assignedEmployeeId && parseInt(assignedEmployeeId, 10) > 0) {
      const parsedId = parseInt(assignedEmployeeId, 10);
      const empRec = await prisma.employees.findFirst({
        where: { hospital_id: hosp.id, OR: [{ id: parsedId }, { user_id: parsedId }] },
        include: { users: true },
      });
      if (!empRec) {
        const crossEmp = await prisma.employees.findFirst({
          where: { OR: [{ id: parsedId }, { user_id: parsedId }] },
          include: { hospitals: true },
        });
        if (crossEmp) {
          const err = new Error(
            `Hospital Isolation Violation: Employee '${crossEmp.name}' belongs to hospital '${crossEmp.hospitals?.name || crossEmp.hospital_id}', not '${hospitalCode}'. Cross-hospital desk assignment is strictly prohibited.`
          );
          err.status = 403;
          err.code = "HOSPITAL_ISOLATION_VIOLATION";
          throw err;
        }
        const err = new Error(`Employee #${parsedId} not found in hospital '${hospitalCode}'.`);
        err.status = 404;
        err.code = "EMPLOYEE_NOT_FOUND";
        throw err;
      }

      // Availability enforcement
      const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
      const lastLogin = empRec.users?.last_login_at ? new Date(empRec.users.last_login_at).getTime() : null;
      const isStale = !lastLogin || (Date.now() - lastLogin > SESSION_MAX_AGE_MS);
      const isOnline = empRec.status === "active" && empRec.users?.status === "active" && !isStale;

      if (!isOnline) {
        const err = new Error(
          `Cannot assign desk: Doctor/Staff '${empRec.name}' is currently INACTIVE / OFFLINE. An employee must be actively logged in before being assigned to an active desk.`
        );
        err.status = 409;
        err.code = "EMPLOYEE_INACTIVE";
        throw err;
      }

      targetEmpId = empRec.id;

      // Clear previous desk assignment for this employee
      await prisma.desks.updateMany({
        where: { hospital_id: hosp.id, assigned_employee_id: targetEmpId, NOT: { id: dId } },
        data: { assigned_employee_id: null },
      });
    } else {
      targetEmpId = null;
    }
  }

  const updated = await prisma.desks.update({
    where: { id: dId },
    data: {
      desk_name: targetName,
      department_id: targetDeptId,
      assigned_employee_id: targetEmpId,
      updated_at: new Date(),
    },
    include: {
      departments: true,
      employees: {
        include: { users: true },
      },
    },
  });

  return {
    id: updated.id,
    desk_number: updated.desk_number,
    desk_name: updated.desk_name,
    department_id: updated.department_id,
    status: updated.status,
    dept_code: updated.departments?.dept_code || "",
    department_name: updated.departments?.name || "",
    assigned_employee_id: updated.assigned_employee_id,
    assigned_employee_name: updated.employees?.name || null,
    assigned_employee_role: updated.employees?.users?.role || null,
  };
}

async function bulkUpdateDeskStatus(hospitalCode, deptCode, status) {
  const hosp = await prisma.hospitals.findUnique({
    where: { hospital_code: String(hospitalCode).trim() },
  });
  if (!hosp) {
    const err = new Error(`Hospital '${hospitalCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const dept = await prisma.departments.findFirst({
    where: { hospital_id: hosp.id, dept_code: String(deptCode).trim().toLowerCase() },
  });
  if (!dept) {
    const err = new Error(`Department '${deptCode}' not found.`);
    err.status = 404;
    throw err;
  }

  const result = await prisma.desks.updateMany({
    where: { hospital_id: hosp.id, department_id: dept.id },
    data: { status, updated_at: new Date(), last_active_at: new Date() },
  });

  return { success: true, updated_count: result.count, status };
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

/**
 * Retrieves historical patient visit logs and footfall statistics for a specific hospital.
 */
async function getHospitalVisitHistory(hospitalCode, limit = 60) {
  const hCode = String(hospitalCode).trim();
  const hospital = await prisma.hospitals.findUnique({
    where: { hospital_code: hCode },
    select: { id: true, name: true, hospital_code: true },
  });
  if (!hospital) return null;

  const todayStr = getCurrentQueueDate();
  const todayDateObj = queueDateToPrismaDate(todayStr);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalAllTime,
    allTimeCompleted,
    todayTickets,
    todayCompleted,
    thisWeekVisits,
    thisMonthVisits,
    recentTickets,
  ] = await Promise.all([
    prisma.tickets.count({ where: { hospital_id: hospital.id } }).catch(() => 0),
    prisma.tickets.count({ where: { hospital_id: hospital.id, status: { in: ["completed", "COMPLETED"] } } }).catch(() => 0),
    prisma.tickets.count({ where: { hospital_id: hospital.id, queue_date: todayDateObj } }).catch(() => 0),
    prisma.tickets.count({ where: { hospital_id: hospital.id, queue_date: todayDateObj, status: { in: ["completed", "COMPLETED"] } } }).catch(() => 0),
    prisma.tickets.count({ where: { hospital_id: hospital.id, created_at: { gte: sevenDaysAgo } } }).catch(() => 0),
    prisma.tickets.count({ where: { hospital_id: hospital.id, created_at: { gte: startOfMonth } } }).catch(() => 0),
    prisma.tickets.findMany({
      where: { hospital_id: hospital.id },
      include: {
        departments: true,
        patients: true,
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: limit,
    }).catch(() => []),
  ]);

  const visits = recentTickets.map((t) => ({
    id: t.id,
    ticket_id: t.ticket_id,
    token_number: t.ticket_id,
    patient_name: t.name || t.patients?.name || "Patient",
    phone: t.patients?.phone || "",
    gender: t.patients?.gender || "",
    age: t.patients?.age || null,
    department: t.departments?.name || t.service_category || "General OPD",
    dept_code: t.departments?.dept_code || t.service_category || "consultation",
    status: (t.status || "").toLowerCase(),
    priority_level: t.priority_level,
    medical_condition: t.medical_condition,
    join_time: t.join_timestamp ? t.join_timestamp.toISOString() : null,
    serve_start_time: t.serve_start_time ? t.serve_start_time.toISOString() : null,
    serve_end_time: t.serve_end_time ? t.serve_end_time.toISOString() : null,
    service_duration_minutes: Math.round((t.actual_service_minutes || t.predicted_service_minutes || 10) * 10) / 10,
    created_at: t.created_at ? t.created_at.toISOString() : null,
    queue_date: t.queue_date ? t.queue_date.toISOString().split("T")[0] : todayStr,
  }));

  return {
    hospital_id: hospital.id,
    hospital_code: hospital.hospital_code,
    hospital_name: hospital.name,
    summary: {
      total_patients_visited_all_time: Math.max(totalAllTime, allTimeCompleted),
      all_time_completed: allTimeCompleted,
      today_patients_visited: todayTickets,
      today_completed: todayCompleted,
      this_week_visits: thisWeekVisits,
      this_month_visits: thisMonthVisits,
    },
    visits,
  };
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
  updateHospitalDepartment,
  deleteHospitalDepartment,
  getHospitalDesks,
  addHospitalDesk,
  updateHospitalDesk,
  assignHospitalDesk,
  deleteHospitalDesk,
  updateDeskStatus,
  bulkUpdateDeskStatus,
  getDatabaseOverview,
  getHospitalVisitHistory,
};
