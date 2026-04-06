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
