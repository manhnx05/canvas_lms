import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
  socket.emit("join", "test-user-id");
  console.log("Emitted join for test-user-id");

  // Wait 1 second then exit
  setTimeout(() => {
    console.log("Disconnecting");
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
  process.exit(1);
});
