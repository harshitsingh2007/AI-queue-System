/**
 * tests/socket.test.js
 * --------------------
 * Real-Time Socket.IO Event Verification & Hospital Isolation.
 */

const assert = require("assert");
const http = require("http");
const { io: ioClient } = require("socket.io-client");
const { initSocket } = require("../src/socket");
const app = require("../src/app");

async function runSocketTests() {
  console.log("\n==================================================");
  console.log(" 🧪 RUNNING REAL-TIME SOCKET.IO & EVENT TESTS");
  console.log("==================================================");

  const server = http.createServer(app);
  const ioServer = initSocket(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const serverUrl = `http://localhost:${port}`;

  const clientA = ioClient(serverUrl, {
    auth: { tenant_id: "hospital-socket-a" },
  });

  const clientB = ioClient(serverUrl, {
    auth: { tenant_id: "hospital-socket-b" },
  });

  try {
    // 1. Connection & Initial Queue Snapshot
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Socket connection timeout")), 4000);
      let count = 0;
      const checkDone = () => {
        count++;
        if (count === 2) {
          clearTimeout(timeout);
          resolve();
        }
      };
      clientA.on("connect", checkDone);
      clientB.on("connect", checkDone);
    });

    console.log(`[PASS] Test 1: Socket.IO connected across multiple test tenants on port ${port}.`);

    // 2. Tenant Room Isolation
    let clientBReceivedEvent = false;
    clientB.on("now_serving", () => {
      clientBReceivedEvent = true;
    });

    const receivedAPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Hospital A did not receive event")), 3000);
      clientA.on("now_serving", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    // Broadcast only to Hospital A after listener is active
    ioServer.to("hospital-socket-a").emit("now_serving", {
      ticket: { ticket_id: "T-TEST-A", patient_name: "Patient A" },
    });

    const receivedA = await receivedAPromise;
    assert.strictEqual(receivedA.ticket.ticket_id, "T-TEST-A", "Hospital A received its own event");
    assert.strictEqual(clientBReceivedEvent, false, "Hospital B must NOT receive events meant for Hospital A");
    console.log("[PASS] Test 2: Real-time Socket.IO room isolation verified (Zero event leakage).");

    // 3. Queue Join via Socket Event
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Join queue event timeout")), 6000);
      clientA.on("error", (err) => {
        console.error("Socket ClientA error:", err);
      });
      clientA.on("ticket_created", (data) => {
        assert.ok(data.ticket, "Must return created ticket");
        clearTimeout(timeout);
        resolve();
      });

      clientA.emit("join_queue", {
        tenant_id: "hospital-socket-a",
        consumer_type: "hospital",
        service_category: "consultation",
        name: "Socket Patient",
        urgency: "routine",
      });
    });
    console.log("[PASS] Test 3: Socket 'join_queue' event successfully creates ticket & broadcasts update.");

    console.log("✅ ALL REAL-TIME SOCKET.IO TESTS PASSED!\n");
  } finally {
    clientA.disconnect();
    clientB.disconnect();
    await new Promise((resolve) => server.close(resolve));
  }
}

module.exports = { runSocketTests };

if (require.main === module) {
  runSocketTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Socket Test Failed:", err);
      process.exit(1);
    });
}
