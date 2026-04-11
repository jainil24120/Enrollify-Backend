import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";

import {
  getAdminUsers,
  getAllWebinars,
  getAllRegistrations,
  getAdminSubscriptions
} from "../controllers/adminCont.js";

import { getAdminAnalytics } from "../controllers/adminAnalyticsController.js";
import { getAdminRevenue } from "../controllers/adminRevenueController.js";
import PlatformSettings from "../models/platformSettings.js";

const router = express.Router();

// 🔹 Dashboard
router.get("/analytics", protect, isAdmin, getAdminAnalytics);

// 🔹 Users / Creators
router.get("/users", protect, isAdmin, getAdminUsers);

// 🔹 Webinars
router.get("/webinars", protect, isAdmin, getAllWebinars);

// 🔹 Registrations
router.get("/registrations", protect, isAdmin, getAllRegistrations);

// 🔹 Revenue
router.get("/revenue", protect, isAdmin, getAdminRevenue);

// 🔹 Subscriptions
router.get("/subscriptions", protect, isAdmin, getAdminSubscriptions);

// 🔹 Platform Settings (admin only)
router.get("/settings", protect, isAdmin, async (req, res) => {
  try {
    const settings = await PlatformSettings.find();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/settings", protect, isAdmin, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await PlatformSettings.setSetting(key, value);
    }
    res.json({ success: true, message: "Settings saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 Public: Get platform banner (no auth required)
router.get("/public/banner", async (req, res) => {
  try {
    const banner = await PlatformSettings.getSetting("globalAlertText", "");
    res.json({ banner });
  } catch (err) {
    res.json({ banner: "" });
  }
});

export default router;