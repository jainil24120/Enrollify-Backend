import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppStatus,
  broadcastMessage,
  scheduleMessage,
  getScheduledMessages,
  getAllSessions,
} from "../controllers/whatsappCon.js";

const router = express.Router();

router.post("/connect", protect, connectWhatsApp);
router.post("/disconnect", protect, disconnectWhatsApp);
router.get("/status", protect, getWhatsAppStatus);
router.post("/broadcast", protect, broadcastMessage);
router.post("/schedule", protect, scheduleMessage);
router.get("/history/:webinarId", protect, getScheduledMessages);
router.get("/sessions", protect, getAllSessions);

export default router;
