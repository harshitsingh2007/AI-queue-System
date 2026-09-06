/**
 * auth.controller.js
 * ------------------
 * Authentication & Identity Controller: Signups, Login, Profile, User Management.
 */

const prisma = require("../config/prisma");
const { hashPassword, verifyPassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const { createHospital } = require("../services/hospitalService");
const engine = require("../services/queueEngine");

async function signupSuperAdmin(req, res, next) {
  try {
    const { email, username, password, phone = "", hospital_name = "", hospital_code = "" } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail || !username || !password) {
      return res.status(400).json({ status: "error", message: "Email, username, and password are required." });
    }

    const existing = await prisma.users.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ status: "error", message: "An account with this email address already exists." });
    }

    const pwdHash = await hashPassword(password);
    const user = await prisma.users.create({
      data: {
        email: cleanEmail,
        username,
        password_hash: pwdHash,
        role: "superadmin",
        status: "active",
        phone: phone || "",
      },
    });

    const hCode = (hospital_code || `hosp-${Math.floor(Date.now() / 1000)}`).trim().toLowerCase();
    const hName = (hospital_name || `${username}'s Hospital`).trim();

    const hospital = await createHospital({
      hospitalCode: hCode,
      name: hName,
      phone,
      email: cleanEmail,
      ownerUserId: user.id,
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role, hospitalId: hospital.id });

    return res.status(200).json({
      status: "success",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        hospital_code: hCode,
        hospital_name: hName,
        hospital_id: hospital.id,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function signupAdmin(req, res, next) {
  try {
    const { email, username, password, phone = "", hospital_code = "city-hospital-01" } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail || !username || !password) {
      return res.status(400).json({ status: "error", message: "Email, username, and password are required." });
    }

    const existing = await prisma.users.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ status: "error", message: "An account with this email address already exists." });
    }

    const hid = await engine.resolveHospitalId(hospital_code);
    const pwdHash = await hashPassword(password);

    const user = await prisma.users.create({
      data: {
        email: cleanEmail,
        username,
        password_hash: pwdHash,
        role: "admin",
        status: "active",
        phone: phone || "",
      },
    });

    const employee = await prisma.employees.create({
      data: {
        user_id: user.id,
        hospital_id: hid,
        employee_code: `EMP-${user.id}`,
        name: username,
        phone: phone || "",
        status: "active",
      },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role, hospitalId: hid });

    return res.status(200).json({
      status: "success",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        hospital_code,
        hospital_id: hid,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function signupPatient(req, res, next) {
  try {
    const { email, username, password, phone = "" } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail || !username || !password) {
      return res.status(400).json({ status: "error", message: "Email, username, and password are required." });
    }

    const existing = await prisma.users.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ status: "error", message: "An account with this email address already exists." });
    }

    const pwdHash = await hashPassword(password);
    const user = await prisma.users.create({
      data: {
        email: cleanEmail,
        username,
        password_hash: pwdHash,
        role: "user",
        status: "active",
        phone: phone || "",
      },
    });

    await prisma.patients.create({
      data: {
        user_id: user.id,
        medical_id: "",
        name: username,
        phone: phone || "",
        gender: "other",
        age: 30,
      },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.status(200).json({
      status: "success",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        phone: user.phone || "",
        status: "active",
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const identifier = String(email || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(401).json({ status: "error", message: "Email and password are required." });
    }

    // Lookup user by email OR employee_code
    let user = await prisma.users.findFirst({
      where: {
        OR: [{ email: { equals: identifier, mode: "insensitive" } }, { username: { equals: identifier, mode: "insensitive" } }],
      },
      include: {
        patients: true,
        employees: {
          include: {
            departments: true,
            hospitals: true,
          },
        },
        hospitals: true,
      },
    });

    if (!user) {
      const emp = await prisma.employees.findFirst({
        where: { employee_code: { equals: identifier, mode: "insensitive" } },
        include: {
          users: {
            include: {
              patients: true,
              employees: {
                include: {
                  departments: true,
                  hospitals: true,
                },
              },
              hospitals: true,
            },
          },
        },
      });
      if (emp) user = emp.users;
    }

    if (!user) {
      return res.status(401).json({ status: "error", message: "Invalid email or password." });
    }

    // Verify Password (Dual support: bcrypt + legacy SHA-256)
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ status: "error", message: "Invalid email or password." });
    }

    if (user.status === "inactive") {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated. Please contact your hospital administrator.",
      });
    }

    // Update last login timestamp
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.employees[0]?.hospital_id || user.hospitals[0]?.id || null,
    });

    const pat = user.patients[0] || null;
    const emp = user.employees[0] || null;
    const ownedH = user.hospitals[0] || null;

    const responseUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status || "active",
      phone: user.phone || "",
    };

    if (pat) {
      responseUser.medical_id = pat.medical_id || "";
      responseUser.age = pat.age || 0;
      responseUser.gender = pat.gender || "";
    }

    if (emp) {
      responseUser.hospital_code = emp.hospitals?.hospital_code || "city-hospital-01";
      responseUser.hospital_name = emp.hospitals?.name || "City General Hospital";
      responseUser.department = emp.departments?.dept_code || "all";
      responseUser.employee_id = emp.employee_code || "";
    } else if (ownedH) {
      responseUser.hospital_code = ownedH.hospital_code;
      responseUser.hospital_name = ownedH.name;
    } else if (["doctor", "staff", "admin", "receptionist"].includes(user.role)) {
      responseUser.hospital_code = "city-hospital-01";
      responseUser.hospital_name = "City General Hospital";
    }

    return res.status(200).json({
      status: "success",
      token,
      user: responseUser,
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const emailParam = req.query.email || req.user?.email;
    if (!emailParam) {
      return res.status(400).json({ status: "error", message: "Email parameter or token required." });
    }

    const cleanEmail = String(emailParam).trim().toLowerCase();
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: { equals: cleanEmail, mode: "insensitive" } }, { username: { equals: cleanEmail, mode: "insensitive" } }],
      },
      include: {
        patients: true,
        employees: {
          include: {
            departments: true,
            hospitals: true,
          },
        },
        hospitals: true,
      },
    });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const pat = user.patients[0] || null;
    const emp = user.employees[0] || null;
    const ownedH = user.hospitals[0] || null;

    const responseUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status || "active",
      phone: user.phone || "",
      created_at: user.created_at ? user.created_at.toISOString() : null,
      last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null,
    };

    if (pat) {
      responseUser.medical_id = pat.medical_id || "";
      responseUser.age = pat.age || 0;
      responseUser.gender = pat.gender || "";
    }

    if (emp) {
      responseUser.hospital_code = emp.hospitals?.hospital_code || "city-hospital-01";
      responseUser.hospital_name = emp.hospitals?.name || "City General Hospital";
      responseUser.department = emp.departments?.dept_code || "all";
      responseUser.employee_id = emp.employee_code || "";
    } else if (ownedH) {
      responseUser.hospital_code = ownedH.hospital_code;
      responseUser.hospital_name = ownedH.name;
    } else if (["doctor", "staff", "admin", "receptionist"].includes(user.role)) {
      responseUser.hospital_code = "city-hospital-01";
      responseUser.hospital_name = "City General Hospital";
    }

    return res.status(200).json({
      status: "success",
      user: responseUser,
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { email, username, phone = "", gender = "", age = 0, medical_id = "" } = req.body;
    const cleanEmail = String(email || req.user?.email || "").trim().toLowerCase();

    const user = await prisma.users.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: {
        username: username || user.username,
        phone: phone || user.phone,
        updated_at: new Date(),
      },
    });

    const pat = await prisma.patients.findFirst({ where: { user_id: user.id } });
    if (pat) {
      await prisma.patients.update({
        where: { id: pat.id },
        data: {
          name: username || pat.name,
          phone: phone || pat.phone,
          gender: gender || pat.gender,
          age: parseInt(age, 10) || pat.age,
          medical_id: medical_id || pat.medical_id,
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.patients.create({
        data: {
          user_id: user.id,
          name: username || user.username,
          phone: phone || "",
          gender: gender || "other",
          age: parseInt(age, 10) || 30,
          medical_id: medical_id || "",
        },
      });
    }

    return getMe(req, res, next);
  } catch (error) {
    next(error);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        phone: true,
        created_at: true,
      },
      orderBy: { id: "asc" },
    });

    return res.status(200).json({
      status: "success",
      users,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserHistory(req, res, next) {
  try {
    const identifier = req.params.email || req.params.identifier;
    const nameQuery = req.query.name;
    const cleanId = String(identifier || "").trim().toLowerCase();

    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: { equals: cleanId, mode: "insensitive" } }, { username: { equals: cleanId, mode: "insensitive" } }],
      },
    });
    const uid = user ? user.id : null;

    const tickets = await prisma.tickets.findMany({
      where: {
        OR: [
          ...(uid
            ? [
                { patients: { user_id: uid } },
                { patients: { family_members: { some: { user_id: uid } } } },
              ]
            : []),
          { patients: { users: { email: { equals: cleanId, mode: "insensitive" } } } },
          { patients: { users: { username: { equals: cleanId, mode: "insensitive" } } } },
          { name: { equals: cleanId, mode: "insensitive" } },
          { patients: { name: { equals: cleanId, mode: "insensitive" } } },
          ...(nameQuery ? [{ name: { equals: String(nameQuery).trim(), mode: "insensitive" } }] : []),
        ],
      },
      include: {
        departments: true,
        hospitals: true,
      },
      orderBy: { join_timestamp: "desc" },
      take: 100,
    });

    const formatted = tickets.map((t) => ({
      ticket_id: t.ticket_id,
      name: t.name,
      status: t.status,
      service_category: t.service_category,
      priority_level: t.priority_level,
      position: t.position,
      estimated_wait_minutes: t.estimated_wait_minutes,
      created_at: t.join_timestamp ? t.join_timestamp.toISOString() : null,
      serve_start_time: t.serve_start_time ? t.serve_start_time.toISOString() : null,
      serve_end_time: t.serve_end_time ? t.serve_end_time.toISOString() : null,
      actual_service_minutes: t.actual_service_minutes,
      prescription_notes: t.prescription_notes || "",
      cancellation_reason: t.cancellation_reason || "",
      cancelled_at: t.cancelled_at ? t.cancelled_at.toISOString() : null,
      medical_condition: t.medical_condition,
      pre_existing_condition: t.pre_existing_condition,
      source: t.source,
      appointment_id: t.appointment_id || "",
      hospital_code: t.hospitals?.hospital_code || "city-hospital-01",
      department_name: t.departments?.name || t.service_category,
    }));

    return res.status(200).json({
      status: "success",
      tickets: formatted,
      count: formatted.length,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signupSuperAdmin,
  signupAdmin,
  signupPatient,
  login,
  getMe,
  updateProfile,
  getAllUsers,
  getUserHistory,
};
