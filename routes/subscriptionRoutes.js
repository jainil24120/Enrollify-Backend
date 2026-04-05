import express from "express";
import {
  createSubscription,
  getAllSubscriptions,
  updateSubscription,
} from "../controllers/subscriptionCon.js";

import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { checkClientProfileComplete } from "../middleware/checkClientProfileComplete.js";
import { createProfileAndOrder, verifySubscriptionPayment } from "../controllers/subscriptionOrder.js"


const router = express.Router();

// 🔒 ADMIN ONLY
router.post("/", protect, isAdmin, createSubscription);

// 🌍 PUBLIC
router.get("/", getAllSubscriptions);

// ✅ SUBSCRIPTION WITH PROFILE CHECK - User must have complete profile to subscribe
router.post("/create-order", protect, createProfileAndOrder);
router.post("/verify", protect, verifySubscriptionPayment);
router.put("/:id", protect, isAdmin, updateSubscription);

export default router;
