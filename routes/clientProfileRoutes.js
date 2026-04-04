import express from "express";
import {
  createClientProfile,
  getMyClientProfile,
} from "../controllers/clientProfileCon.js";

import { protect } from "../middleware/authMiddleware.js";
import Webinar from "../models/webinar.js";

const router = express.Router();

// CLIENT PROFILE
router.post("/", protect, createClientProfile);
router.get("/me", protect, getMyClientProfile);

// PUBLIC WEBINARS (subdomain based)
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
