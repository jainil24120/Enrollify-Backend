import express from "express";
import {
  createClientProfile,
  getMyClientProfile,
} from "../controllers/clientProfileCon.js";

import { protect } from "../middleware/authMiddleware.js";
import { checkClientProfileComplete } from "../middleware/checkClientProfileComplete.js";
import { createProfileAndOrder, verifySubscriptionPayment } from "../controllers/subscriptionOrder.js";
import ClientProfile from "../models/clientProfile.js";
import Webinar from "../models/webinar.js";

const router = express.Router();

// CLIENT PROFILE
router.post("/", protect, createClientProfile);
router.get("/me", protect, getMyClientProfile);

// UPDATE CLIENT PROFILE
router.put("/me", protect, async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const allowed = ["first_name", "last_name", "Organization_Name", "phone", "gstNumber", "bio", "upiId", "bankDetails", "subdomain"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        profile[key] = req.body[key];
      }
    }
    await profile.save();
    res.json({ success: true, message: "Profile updated", profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CHECK SUBDOMAIN AVAILABILITY
router.get("/check-subdomain", protect, async (req, res) => {
  try {
    const subdomain = (req.query.subdomain || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (subdomain.length < 3) {
      return res.json({ available: false, reason: "Too short" });
    }

    const existing = await ClientProfile.findOne({ subdomain });

    // No one has it — available
    if (!existing) {
      return res.json({ available: true });
    }

    // Same user already owns it — available (reuse)
    if (existing.user.toString() === req.user.id) {
      return res.json({ available: true, reason: "You already own this subdomain" });
    }

    // Different user — check if their subscription expired
    if (existing.subscriptionValidTill && new Date(existing.subscriptionValidTill) < new Date()) {
      return res.json({ available: true, reason: "Previous owner's subscription expired" });
    }

    // Taken by active user
    return res.json({ available: false, reason: "Already taken by an active user" });
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
});

// Payment routes (also available via /api/subscriptions/)
router.post("/create-order", protect, createProfileAndOrder);
router.post("/verify", protect, verifySubscriptionPayment);

// PUBLIC: Get client + webinars by subdomain
router.get("/by-subdomain/:subdomain", async (req, res) => {
  try {
    const client = await ClientProfile.findOne({
      subdomain: req.params.subdomain.toLowerCase(),
      isActive: true,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const webinars = await Webinar.find({
      clients: client._id,
      status: { $in: ["published", "scheduled", "live"] },
    }).sort({ webinarDateTime: -1 });

    res.json({
      client: {
        name: client.Organization_Name,
        subdomain: client.subdomain,
      },
      webinars,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUBLIC WEBINARS (subdomain based - legacy)
router.get("/webinars", async (req, res) => {
  try {
    if (!req.client) {
      return res.json({
        message: "Main Enrollify Website"
      });
    }

    const webinars = await Webinar.find({
      clients: req.client._id
    });

    res.json({
      client: req.client.Organization_Name,
      webinars
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

export default router;
