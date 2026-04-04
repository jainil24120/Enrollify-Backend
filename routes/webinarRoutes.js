import express from "express";
import {
  getAllWebinar,
  getWebinarById,
  editWebinar,
} from "../controllers/webinarCon.js";
import { createWebinar, rescheduleWebinar } from "../controllers/webinarCon.js";
import { protect } from "../middleware/authwebinar.js";
import { isClient } from "../middleware/clientWebinar.js";
import { checkWebinarAccess } from "../middleware/checkWebinarAccess.js";
import { checkClientProfileComplete } from "../middleware/checkClientProfileComplete.js";
import { paidOnly } from "../middleware/subplan.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Admin + Client → Create webinar (clients must have an active paid subscription)
router.post(
  "/",
  protect,
  isClient,
  checkClientProfileComplete,
  upload.single("bannerImage"),
  createWebinar
);
router.get(
  "/join/:webinarId",
  protect,
  checkWebinarAccess,
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome to webinar 🎉"
    });
  }
);
// Public routes
router.patch(
  "/:webinarId/reschedule",
  protect,
  rescheduleWebinar
);
router.get("/", protect, getAllWebinar);
router.put("/:webinarId", protect, upload.single("bannerImage"), editWebinar);
router.get("/:id", getWebinarById);

// module.exports = router;
export default router
