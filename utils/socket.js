import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Join user-specific room for targeted notifications
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Join admin room
    socket.on("join-admin", () => {
      socket.join("admin");
    });

    // Join webinar room (for live webinar features)
    socket.on("join-webinar", (webinarId) => {
      if (webinarId) {
        socket.join(`webinar_${webinarId}`);
      }
    });

    socket.on("leave-webinar", (webinarId) => {
      if (webinarId) {
        socket.leave(`webinar_${webinarId}`);
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
