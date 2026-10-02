const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMMY_USER_IDS = [7, 14, 15, 28, 9, 289, 31, 8, 108, 176, 288, 205];

async function main() {
  console.log('Starting cleanup...\n');

  // Step 1: Find + delete employees linked to dummy users
  const empToDelete = await prisma.employees.findMany({
    where: { user_id: { in: DUMMY_USER_IDS } },
    select: { id: true, user_id: true, employee_code: true }
  });
  const empIds = empToDelete.map(e => e.id);
  console.log('Employees to delete:', empToDelete.length, '->', empToDelete.map(e => e.employee_code).join(', '));

  if (empIds.length > 0) {
    const delEmp = await prisma.employees.deleteMany({ where: { id: { in: empIds } } });
    console.log('Employees deleted:', delEmp.count);
  }

  // Step 2: Delete patients linked to dummy users
  const delPatients = await prisma.patients.deleteMany({ where: { user_id: { in: DUMMY_USER_IDS } } });
  console.log('Dummy patients deleted:', delPatients.count);

  // Step 3: Delete family_members linked to dummy users (FK constraint)
  const delFamily = await prisma.family_members.deleteMany({ where: { user_id: { in: DUMMY_USER_IDS } } });
  console.log('Family members deleted:', delFamily.count);

  // Step 4: Delete audit_logs linked to dummy users
  const delAudit = await prisma.audit_logs.deleteMany({ where: { user_id: { in: DUMMY_USER_IDS } } });
  console.log('Audit logs deleted:', delAudit.count);

  // Step 5: Delete queue_events for dummy users
  const delQEvents = await prisma.queue_events.deleteMany({ where: { performed_by_user_id: { in: DUMMY_USER_IDS } } });
  console.log('Queue events deleted:', delQEvents.count);

  // Step 6: Delete the dummy user accounts
  const delUsers = await prisma.users.deleteMany({ where: { id: { in: DUMMY_USER_IDS } } });
  console.log('Users deleted:', delUsers.count);

  console.log('\n=== Cleanup complete! ===\n');

  const remaining = await prisma.users.findMany({
    select: { id: true, username: true, email: true, role: true, status: true }
  });
  console.log('=== REMAINING USERS ===');
  remaining.forEach(u => console.log(u.id, '|', u.username, '|', u.email, '|', u.role, '|', u.status));
}

main().catch(console.error).finally(() => prisma.$disconnect());
