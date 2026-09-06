/**
 * prisma.js
 * ---------
 * Singleton instance of PrismaClient with connection handling and logging.
 */

const { PrismaClient } = require("@prisma/client");
const env = require("./env");

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

module.exports = prisma;
