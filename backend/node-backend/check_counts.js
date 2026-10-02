const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hCount = await prisma.hospitals.count();
  const uCount = await prisma.users.count();
  const eCount = await prisma.employees.count();
  const dCount = await prisma.desks.count();
  const tCount = await prisma.tickets.count();
  const pCount = await prisma.patients.count();
  const depCount = await prisma.departments.count();
  console.log('hospitals:', hCount);
  console.log('users:', uCount);
  console.log('employees:', eCount);
  console.log('desks:', dCount);
  console.log('tickets:', tCount);
  console.log('patients:', pCount);
  console.log('departments:', depCount);
}
main().catch(console.error).finally(() => prisma.$disconnect());
