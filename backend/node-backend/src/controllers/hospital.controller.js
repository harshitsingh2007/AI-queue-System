/**
 * hospital.controller.js
 * ----------------------
 * Hospital & SuperAdmin Operations Controllers.
 */

const {
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
} = require("../services/hospitalService");
const { verifyHospitalAccess } = require("../middleware/hospitalIsolation");

async function getHospitalInfoEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    const hospital = await getHospitalByCode(hospitalCode);
    return res.status(200).json({
      status: "success",
      hospital: hospital || { hospital_code: hospitalCode, name: "Hospital" },
    });
  } catch (error) {
    next(error);
  }
}

async function getSuperadminOverviewEndpoint(req, res, next) {
  try {
    const overview = await getSuperAdminOverview(req.user);
    return res.status(200).json({
      status: "success",
      overview,
    });
  } catch (error) {
    next(error);
  }
}

async function getSuperadminHospitalsEndpoint(req, res, next) {
  try {
    const hospitals = await getAllHospitals(req.user);
    return res.status(200).json({
      status: "success",
      hospitals,
    });
  } catch (error) {
    next(error);
  }
}

async function createHospitalEndpoint(req, res, next) {
  try {
    const {
      hospital_code,
      name,
      address = "",
      phone = "",
      email = "",
      description = "",
      logo_url = "",
      status = "active",
    } = req.body;

    if (!hospital_code || !name) {
      return res.status(400).json({ status: "error", message: "Hospital code and name are required." });
    }

    const hospital = await createHospital({
      hospitalCode: hospital_code,
      name,
      address,
      phone,
      email,
      description,
      logoUrl: logo_url,
      status,
      ownerUserId: req.user?.id || null,
    });

    return res.status(200).json({
      status: "success",
      hospital,
    });
  } catch (error) {
    next(error);
  }
}

async function getHospitalDetailEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have access to this hospital's resources.",
        });
      }
    }

    const hospital = await getHospitalByCode(hospitalCode);
    if (!hospital) {
      return res.status(404).json({ status: "error", message: "Hospital not found" });
    }

    return res.status(200).json({
      status: "success",
      hospital,
    });
  } catch (error) {
    next(error);
  }
}

async function updateHospitalEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have ownership of this hospital.",
        });
      }
    }

    const updated = await updateHospital(hospitalCode, req.body);
    return res.status(200).json({
      status: "success",
      hospital: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function getHospitalBrandingEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    const branding = await getHospitalBranding(hospitalCode);
    return res.status(200).json({
      status: "success",
      hospital_code: hospitalCode,
      branding,
    });
  } catch (error) {
    next(error);
  }
}

async function updateHospitalBrandingEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have permission to customize this hospital's branding.",
        });
      }
    }

    const result = await updateHospitalBranding(hospitalCode, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteHospitalEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have ownership of this hospital.",
        });
      }
    }

    const result = await deleteHospital(hospitalCode);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getHospitalEmployeesEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have access to this hospital's employees.",
        });
      }
    }

    const employees = await getHospitalEmployees(hospitalCode);
    return res.status(200).json({
      status: "success",
      employees,
    });
  } catch (error) {
    next(error);
  }
}

async function addHospitalEmployeeEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You cannot provision employees for another hospital.",
        });
      }
    }

    const {
      name,
      email,
      role,
      department,
      employee_id = "",
      phone = "",
      password = "pass123",
    } = req.body;

    const employee = await addHospitalEmployee({
      hospitalCode,
      name,
      email,
      role,
      department,
      employeeId: employee_id,
      phone,
      password,
    });

    return res.status(200).json({
      status: "success",
      employee,
    });
  } catch (error) {
    next(error);
  }
}

async function updateHospitalEmployeeEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    const userId = req.params.user_id;

    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have access to manage this employee.",
        });
      }
    }

    const updated = await updateHospitalEmployee(userId, req.body);
    return res.status(200).json({
      status: "success",
      employee: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function updateEmployeePasswordEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    const userId = req.params.user_id;
    const { new_password, password } = req.body;
    const targetPassword = new_password || password;

    if (!targetPassword || String(targetPassword).trim().length < 4) {
      return res.status(400).json({
        status: "error",
        detail: "Password must be at least 4 characters.",
      });
    }

    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          detail: "Forbidden: You do not have access to manage this employee's credentials.",
        });
      }
    }

    const result = await updateEmployeePassword(userId, targetPassword);
    return res.status(200).json({
      status: "success",
      result,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function deleteHospitalEmployeeEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    const userId = req.params.user_id;

    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have access to delete this employee.",
        });
      }
    }

    const result = await deleteHospitalEmployee(userId);
    return res.status(200).json({
      status: "success",
      result,
    });
  } catch (error) {
    next(error);
  }
}

async function getHospitalDepartmentsEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have access to this hospital's departments.",
        });
      }
    }

    const departments = await getHospitalDepartments(hospitalCode);
    return res.status(200).json({
      status: "success",
      departments,
    });
  } catch (error) {
    next(error);
  }
}

async function addHospitalDepartmentEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You cannot modify departments for another hospital.",
        });
      }
    }

    const { dept_code, name, description = "" } = req.body;
    const department = await addHospitalDepartment(hospitalCode, dept_code, name, description);

    return res.status(200).json({
      status: "success",
      department,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteHospitalDepartmentEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    const deptCode = req.params.dept_code;

    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You cannot delete departments from another hospital.",
        });
      }
    }

    const result = await deleteHospitalDepartment(hospitalCode, deptCode);
    return res.status(200).json({
      status: "success",
      result,
    });
  } catch (error) {
    next(error);
  }
}

async function getHospitalDesksEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    if (req.user) {
      const allowed = await verifyHospitalAccess(hospitalCode, req.user);
      if (!allowed) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You do not have access to this hospital's desks.",
        });
      }
    }

    const desks = await getHospitalDesks(hospitalCode);
    return res.status(200).json({
      status: "success",
      desks,
    });
  } catch (error) {
    next(error);
  }
}

async function addHospitalDeskEndpoint(req, res, next) {
  try {
    const hospitalCode = req.params.hospital_code;
    const { dept_code, desk_name, status = "AVAILABLE" } = req.body;

    const desk = await addHospitalDesk(hospitalCode, dept_code, desk_name, status);
    return res.status(200).json({
      status: "success",
      desk,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteHospitalDeskEndpoint(req, res, next) {
  try {
    const deskId = req.params.desk_id;
    const result = await deleteHospitalDesk(deskId);
    return res.status(200).json({
      status: "success",
      result,
    });
  } catch (error) {
    next(error);
  }
}

async function updateDeskStatusEndpoint(req, res, next) {
  try {
    const deskId = req.params.desk_id;
    const { status } = req.body;

    const desk = await updateDeskStatus(deskId, status);
    return res.status(200).json({
      status: "success",
      desk,
    });
  } catch (error) {
    next(error);
  }
}

async function getDbOverviewEndpoint(req, res, next) {
  try {
    const data = await getDatabaseOverview();
    return res.status(200).json({
      status: "success",
      db_info: {
        engine: "PostgreSQL",
        database: "ai_queue",
        status: "Connected",
      },
      database: data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHospitalInfoEndpoint,
  getSuperadminOverviewEndpoint,
  getSuperadminHospitalsEndpoint,
  createHospitalEndpoint,
  getHospitalDetailEndpoint,
  updateHospitalEndpoint,
  getHospitalBrandingEndpoint,
  updateHospitalBrandingEndpoint,
  deleteHospitalEndpoint,
  getHospitalEmployeesEndpoint,
  addHospitalEmployeeEndpoint,
  updateHospitalEmployeeEndpoint,
  updateEmployeePasswordEndpoint,
  deleteHospitalEmployeeEndpoint,
  getHospitalDepartmentsEndpoint,
  addHospitalDepartmentEndpoint,
  deleteHospitalDepartmentEndpoint,
  getHospitalDesksEndpoint,
  addHospitalDeskEndpoint,
  deleteHospitalDeskEndpoint,
  updateDeskStatusEndpoint,
  getDbOverviewEndpoint,
};
