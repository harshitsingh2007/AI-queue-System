const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Hospital IDs from current DB:
// 85  = Raja harish chandra (hosp-1788628440) — your main hospital
// 2   = Raja HarishChandra (110040)
// 143 = City Hospital 01 (city-hospital-01)
// 16  = max hospital (max-hospital-949)

async function main() {
  const salt = await bcrypt.genSalt(10);

  console.log('=== Restoring staff/doctors for Raja harish chandra (hosp-1788628440, id=85) ===');

  // Get department IDs for hospital 85
  const depts = await prisma.departments.findMany({
    where: { hospital_id: 85 },
    select: { id: true, name: true }
  });
  console.log('Available departments:', depts.map(d => d.id + ':' + d.name).join(', '));

  const consultationDept = depts.find(d => d.name && d.name.toLowerCase().includes('consult')) || depts[0];
  const deptId = consultationDept ? consultationDept.id : null;
  console.log('Using dept:', deptId, '-', consultationDept?.name);

  // Get desks for hospital 85
  const desks = await prisma.desks.findMany({
    where: { hospital_id: 85 },
    select: { id: true, desk_name: true, desk_number: true }
  });
  console.log('Desks in hospital 85:', desks.map(d => d.id + ':' + d.desk_name).join(', '));

  // 1. Create a doctor user + employee for hospital 85
  const hashedPwd = await bcrypt.hash('doctor@123', salt);
  
  const doctorUser = await prisma.users.upsert({
    where: { email: 'doctor1@rajahospital.com' },
    update: {},
    create: {
      username: 'Dr. Arvind Sharma',
      email: 'doctor1@rajahospital.com',
      password_hash: hashedPwd,
      role: 'doctor',
      status: 'active',
      phone: '9876543210',
    }
  });
  console.log('\nDoctor user created/found:', doctorUser.id, '-', doctorUser.username);

  // Create employee record for this doctor (find-or-create by hospital+user)
  let doctor1Emp = await prisma.employees.findUnique({
    where: { hospital_id_user_id: { hospital_id: 85, user_id: doctorUser.id } }
  });
  if (!doctor1Emp) {
    doctor1Emp = await prisma.employees.create({
      data: {
        name: 'Dr. Arvind Sharma',
        employee_code: 'EMP-DR-001',
        phone: '9876543210',
        email: 'doctor1@rajahospital.com',
        status: 'active',
        hospital_id: 85,
        user_id: doctorUser.id,
        department_id: deptId,
      }
    });
  }
  console.log('Employee record:', doctor1Emp.id, '-', doctor1Emp.name);

  // 2. Create a staff/receptionist user for hospital 85
  const hashedStaffPwd = await bcrypt.hash('staff@123', salt);
  const staffUser = await prisma.users.upsert({
    where: { email: 'staff1@rajahospital.com' },
    update: {},
    create: {
      username: 'Priya Receptionist',
      email: 'staff1@rajahospital.com',
      password_hash: hashedStaffPwd,
      role: 'admin',
      status: 'active',
      phone: '9876543220',
    }
  });
  console.log('\nStaff user created/found:', staffUser.id, '-', staffUser.username);

  let staff1Emp = await prisma.employees.findUnique({
    where: { hospital_id_user_id: { hospital_id: 85, user_id: staffUser.id } }
  });
  if (!staff1Emp) {
    staff1Emp = await prisma.employees.create({
      data: {
        name: 'Priya Receptionist',
        employee_code: 'EMP-STF-001',
        phone: '9876543220',
        email: 'staff1@rajahospital.com',
        status: 'active',
        hospital_id: 85,
        user_id: staffUser.id,
        department_id: deptId,
      }
    });
  }
  console.log('Staff employee:', staff1Emp.id, '-', staff1Emp.name);

  // 3. Restore some sample patients
  console.log('\n=== Restoring patients ===');
  const patientsToRestore = [
    { name: 'Ramesh Kumar', phone: '9111111111', gender: 'male', age: 45 },
    { name: 'Sunita Devi', phone: '9222222222', gender: 'female', age: 32 },
    { name: 'Anil Gupta', phone: '9333333333', gender: 'male', age: 55 },
    { name: 'Meena Sharma', phone: '9444444444', gender: 'female', age: 28 },
    { name: 'Rakesh Singh', phone: '9555555555', gender: 'male', age: 38 },
    { name: 'Kavita Yadav', phone: '9666666666', gender: 'female', age: 42 },
    { name: 'Vijay Prasad', phone: '9777777777', gender: 'male', age: 60 },
    { name: 'Geeta Kumari', phone: '9888888888', gender: 'female', age: 35 },
    { name: 'Suresh Pal', phone: '9999999999', gender: 'male', age: 50 },
  ];

  let patientCount = 0;
  for (const p of patientsToRestore) {
    const existing = await prisma.patients.findFirst({ where: { phone: p.phone } });
    if (!existing) {
      await prisma.patients.create({ data: p });
      patientCount++;
    }
  }
  console.log('Patients restored:', patientCount);

  // Final count
  console.log('\n=== Final State ===');
  console.log('Users:', await prisma.users.count());
  console.log('Employees:', await prisma.employees.count());
  console.log('Patients:', await prisma.patients.count());
  console.log('\n=== All Users ===');
  const allUsers = await prisma.users.findMany({ select: { id: true, username: true, email: true, role: true, status: true } });
  allUsers.forEach(u => console.log(u.id, '|', u.username, '|', u.email, '|', u.role, '|', u.status));
}

main().catch(console.error).finally(() => prisma.$disconnect());
