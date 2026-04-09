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
import Webinar from "../models/webinar.js";
import Registration from "../models/registration.js";

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

// PUBLIC: Get webinar by slug (for template page)
router.get("/s/:slug", async (req, res) => {
  try {
    const webinar = await Webinar.findOne({ slug: req.params.slug })
      .populate("createdBy", "firstname lastname email")
      .populate("clients", "Organization_Name subdomain")
      .populate("template", "key name customizable");
    if (!webinar) return res.status(404).json({ msg: "Webinar not found" });

    // Get registration count
    const registrationCount = await Registration.countDocuments({ webinar: webinar._id });

    res.json({ ...webinar.toObject(), registrationCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch(
  "/:webinarId/reschedule",
  protect,
  rescheduleWebinar
);
router.get("/", protect, getAllWebinar);
router.put("/:webinarId", protect, upload.single("bannerImage"), editWebinar);
router.get("/:id", getWebinarById);

export default router;
