const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('=== HOSPITALS ===');
  const hospitals = await prisma.hospitals.findMany({
    select: { id: true, name: true, hospital_code: true, status: true, owner_user_id: true, email: true }
  });
  hospitals.forEach(h => console.log(h.id, '|', h.name, '|', h.hospital_code, '|', h.status, '| owner_uid:', h.owner_user_id));

  console.log('\n=== USERS ===');
  const users = await prisma.users.findMany({
    select: { id: true, username: true, email: true, role: true, status: true }
  });
  users.forEach(u => console.log(u.id, '|', u.username, '|', u.email, '|', u.role, '|', u.status));

  console.log('\n=== EMPLOYEES ===');
  const employees = await prisma.employees.findMany({
    select: { id: true, name: true, hospital_id: true, status: true, employee_code: true, phone: true },
    include: { users: { select: { email: true, role: true } } }
  });
  employees.forEach(e => console.log(e.id, '|', e.name, '|', e.employee_code, '| hosp_id:', e.hospital_id, '|', e.status, '| user:', e.users?.email));

  console.log('\n=== DEPARTMENTS ===');
  const depts = await prisma.departments.findMany({
    select: { id: true, name: true, hospital_id: true, status: true }
  });
  depts.forEach(d => console.log(d.id, '|', d.name, '| hosp_id:', d.hospital_id, '|', d.status));

  console.log('\n=== DESKS (summary by hospital) ===');
  const desks = await prisma.desks.findMany({
    select: { id: true, desk_name: true, hospital_id: true, status: true, department_id: true }
  });
  const byHosp = {};
  desks.forEach(d => { byHosp[d.hospital_id] = (byHosp[d.hospital_id] || 0) + 1; });
  Object.entries(byHosp).forEach(([hid, cnt]) => console.log('hosp_id:', hid, '-> desks:', cnt));

  console.log('\n=== PATIENTS ===');
  const patients = await prisma.patients.findMany({
    select: { id: true, name: true, hospital_id: true, user_id: true }
  });
  patients.forEach(p => console.log(p.id, '|', p.name, '| hosp_id:', p.hospital_id, '| user_id:', p.user_id));

  console.log('\n=== TICKETS (recent 10) ===');
  const tickets = await prisma.tickets.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    select: { id: true, name: true, hospital_id: true, status: true, queue_date: true }
  });
  tickets.forEach(t => console.log(t.id, '|', t.name, '| hosp_id:', t.hospital_id, '|', t.status, '|', t.queue_date));
}
main().catch(console.error).finally(() => prisma.$disconnect());
