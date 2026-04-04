import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cors from "cors";
mongoose.set("strictQuery", true);

import usersRoutes from "./routes/usersRoutes.js";
import profileRoutes from "./routes/profile.js";
import webinarRoutes from "./routes/webinarRoutes.js";
import clientProfileRoutes from "./routes/clientProfileRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import enrollRoutes from "./routes/enrollRoutes.js";
import clientDashboardRoutes from "./routes/clientDashboardRoutes.js";
import "./utils/cronjobs.js";
import { initSocket } from "./utils/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Initialize Socket.io
const io = initSocket(server);

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use("/upload", express.static(path.join(__dirname, "upload")));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/users", usersRoutes);
app.use("/profile", profileRoutes);
app.use("/api/webinars", webinarRoutes);
app.use("/api/clientprofile", clientProfileRoutes);
app.use("/api/client", clientDashboardRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/payment", enrollRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch((err) => console.error("Mongo Error:", err));

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
