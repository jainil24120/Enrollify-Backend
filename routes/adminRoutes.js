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

export default router;