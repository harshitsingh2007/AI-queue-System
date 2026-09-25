const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Resolve backend/.env (located in the parent directory of node-backend)
const parentEnvPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
} else {
  dotenv.config();
}
