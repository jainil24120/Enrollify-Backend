import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import { getClientDashboard } from "../controllers/client/dashboard.js";
import { getWebinarStats } from "../controllers/client/webinarstats.js";
import { getAnalytics } from "../controllers/client/analytics.js";
import { getSubscription } from "../controllers/client/subscription.js";
import { upgradeSubscription } from "../controllers/client/upgrade.js";
import { getAudience } from "../controllers/client/audience.js";

const router = express.Router();

router.get("/dashboard", protect, getClientDashboard);
router.get("/webinar-stats", protect, getWebinarStats);
router.get("/analytics", protect, getAnalytics);
router.get("/audience", protect, getAudience);
router.get("/subscription", protect, getSubscription);
router.post("/upgrade", protect, upgradeSubscription);

export default router;