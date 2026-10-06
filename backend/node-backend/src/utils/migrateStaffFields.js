require("../../loadEnv");
const prisma = require("../config/prisma");

async function run() {
  console.log("Applying schema expansion to employees table...");
  const sql = `
    ALTER TABLE employees 
    ADD COLUMN IF NOT EXISTS qualification VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS license_number VARCHAR(100) DEFAULT '',
    ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS room_number VARCHAR(100) DEFAULT '',
    ADD COLUMN IF NOT EXISTS profile_json JSONB DEFAULT '{}'::jsonb;
  `;
  await prisma.$executeRawUnsafe(sql);
  console.log("Employees table schema updated successfully!");
}

run()
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
