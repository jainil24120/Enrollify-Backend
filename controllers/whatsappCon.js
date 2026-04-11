import ClientProfile from "../models/clientProfile.js";
import Webinar from "../models/webinar.js";
import Registration from "../models/registration.js";
import Message from "../models/message.js";
import WhatsappSession from "../models/whatsappSession.js";
import * as whatsappService from "../services/whatsappService.js";

// Get the client profile for the logged-in user
const getClientId = async (userId) => {
  const profile = await ClientProfile.findOne({ user: userId });
  return profile?._id?.toString() || null;
};

export const connectWhatsApp = async (req, res) => {
  try {
    const clientId = await getClientId(req.user.id);
    if (!clientId) return res.status(404).json({ msg: "Client profile not found" });

    await whatsappService.initSession(clientId, req.user.id);
    res.json({ success: true, msg: "Scan QR code on your WhatsApp app" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const disconnectWhatsApp = async (req, res) => {
  try {
    const clientId = await getClientId(req.user.id);
    if (!clientId) return res.status(404).json({ msg: "Client profile not found" });

    await whatsappService.disconnectSession(clientId);
    res.json({ success: true, msg: "WhatsApp disconnected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getWhatsAppStatus = async (req, res) => {
  try {
    const clientId = await getClientId(req.user.id);
    if (!clientId) return res.json({ status: "disconnected", phone: "" });

    const status = await whatsappService.getStatus(clientId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const broadcastMessage = async (req, res) => {
  try {
    const { webinarId, message } = req.body;
    if (!webinarId || !message) {
      return res.status(400).json({ msg: "webinarId and message are required" });
    }

    const clientId = await getClientId(req.user.id);
    if (!clientId) return res.status(404).json({ msg: "Client profile not found" });

    // Verify client owns this webinar
    const webinar = await Webinar.findById(webinarId);
    if (!webinar || webinar.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized for this webinar" });
    }

    const result = await whatsappService.broadcastToWebinar(
      clientId,
      webinarId,
      message.replace(/\{webinar_title\}/g, webinar.title)
        .replace(/\{date\}/g, new Date(webinar.webinarDateTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))
    );

    // Log broadcast in messages
    await Message.create({
      webinar: webinarId,
      type: "broadcast",
      channels: ["whatsapp"],
      subject: "WhatsApp Broadcast",
      body: message,
      scheduledFor: new Date(),
      status: "sent",
      sentAt: new Date(),
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const scheduleMessage = async (req, res) => {
  try {
    const { webinarId, message, scheduledFor, preset } = req.body;
    if (!webinarId || !message) {
      return res.status(400).json({ msg: "webinarId and message are required" });
    }

    const clientId = await getClientId(req.user.id);
    if (!clientId) return res.status(404).json({ msg: "Client profile not found" });

    const webinar = await Webinar.findById(webinarId);
    if (!webinar || webinar.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized for this webinar" });
    }

    // Calculate scheduled time from preset or use provided time
    let scheduleDate;
    if (preset === "1_day_before") {
      scheduleDate = new Date(new Date(webinar.webinarDateTime).getTime() - 24 * 60 * 60 * 1000);
    } else if (preset === "1_hour_before") {
      scheduleDate = new Date(new Date(webinar.webinarDateTime).getTime() - 60 * 60 * 1000);
    } else if (preset === "15_min_before") {
      scheduleDate = new Date(new Date(webinar.webinarDateTime).getTime() - 15 * 60 * 1000);
    } else if (scheduledFor) {
      scheduleDate = new Date(scheduledFor);
    } else {
      return res.status(400).json({ msg: "Provide scheduledFor or preset" });
    }

    if (scheduleDate < new Date()) {
      return res.status(400).json({ msg: "Scheduled time is in the past" });
    }

    // Get all registrants with phone numbers
    const registrations = await Registration.find({ webinar: webinarId, phone: { $exists: true, $ne: "" } });

    // Create a scheduled message for each registrant
    const messages = registrations.map((reg) => ({
      webinar: webinarId,
      user: reg.user || null,
      email: reg.email,
      phone: reg.phone,
      type: "scheduled_custom",
      channels: ["whatsapp"],
      subject: "WhatsApp Scheduled Message",
      body: message
        .replace(/\{name\}/g, `${reg.firstname || ""} ${reg.lastname || ""}`.trim() || "there")
        .replace(/\{webinar_title\}/g, webinar.title)
        .replace(/\{date\}/g, new Date(webinar.webinarDateTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))
        .replace(/\{email\}/g, reg.email || ""),
      scheduledFor: scheduleDate,
      status: "pending",
    }));

    if (messages.length > 0) {
      await Message.insertMany(messages);
    }

    res.json({
      success: true,
      count: messages.length,
      scheduledFor: scheduleDate,
      msg: `${messages.length} messages scheduled`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getScheduledMessages = async (req, res) => {
  try {
    const { webinarId } = req.params;

    const messages = await Message.find({
      webinar: webinarId,
      channels: "whatsapp",
    })
      .sort({ scheduledFor: -1 })
      .limit(50)
      .lean();

    // Group by scheduledFor + body to show as "batches"
    const batches = {};
    for (const msg of messages) {
      const key = `${msg.scheduledFor?.toISOString()}_${msg.body?.substring(0, 50)}`;
      if (!batches[key]) {
        batches[key] = {
          type: msg.type,
          body: msg.body,
          scheduledFor: msg.scheduledFor,
          status: msg.status,
          sentAt: msg.sentAt,
          count: 0,
          sentCount: 0,
          failedCount: 0,
        };
      }
      batches[key].count++;
      if (msg.status === "sent") batches[key].sentCount++;
      if (msg.status === "failed") batches[key].failedCount++;
    }

    res.json(Object.values(batches));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: get all WhatsApp sessions
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await WhatsappSession.find()
      .populate("clientId", "Organization_Name subdomain")
      .populate("userId", "firstname lastname email")
      .lean();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
