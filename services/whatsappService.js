import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import WhatsappSession from "../models/whatsappSession.js";
import Registration from "../models/registration.js";
import { getIO } from "../utils/socket.js";

// Map of active WhatsApp clients: clientId -> WAClient
const clients = new Map();

// Normalize phone to WhatsApp format: 91XXXXXXXXXX@c.us
const formatPhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, "");
  // Remove leading 0
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  // Add India country code if not present
  if (cleaned.length === 10) cleaned = "91" + cleaned;
  // Remove any leading + that survived
  cleaned = cleaned.replace(/^\+/, "");
  return cleaned + "@c.us";
};

export const initSession = async (clientId, userId) => {
  // Destroy existing session if any
  if (clients.has(clientId)) {
    try {
      await clients.get(clientId).destroy();
    } catch (e) {}
    clients.delete(clientId);
  }

  const waClient = new Client({
    authStrategy: new LocalAuth({ clientId: clientId.toString() }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    },
  });

  clients.set(clientId, waClient);

  // Update session status
  await WhatsappSession.findOneAndUpdate(
    { clientId },
    { clientId, userId, status: "qr_pending" },
    { upsert: true, new: true }
  );

  waClient.on("qr", async (qr) => {
    try {
      const qrImage = await QRCode.toDataURL(qr);
      const io = getIO();
      io.to(`user_${userId}`).emit("whatsapp-qr", { qrImage });
    } catch (err) {
      console.error("QR generation error:", err.message);
    }
  });

  waClient.on("ready", async () => {
    const info = waClient.info;
    const phone = info?.wid?.user || "";

    await WhatsappSession.findOneAndUpdate(
      { clientId },
      { status: "connected", phone, lastConnected: new Date() }
    );

    try {
      const io = getIO();
      io.to(`user_${userId}`).emit("whatsapp-ready", { phone });
    } catch (e) {}

    console.log(`WhatsApp connected for client ${clientId}: ${phone}`);
  });

  waClient.on("disconnected", async (reason) => {
    await WhatsappSession.findOneAndUpdate(
      { clientId },
      { status: "disconnected", phone: "" }
    );

    clients.delete(clientId);

    try {
      const io = getIO();
      io.to(`user_${userId}`).emit("whatsapp-disconnected", { reason });
    } catch (e) {}

    console.log(`WhatsApp disconnected for client ${clientId}: ${reason}`);
  });

  waClient.on("auth_failure", async () => {
    await WhatsappSession.findOneAndUpdate(
      { clientId },
      { status: "disconnected" }
    );
    clients.delete(clientId);
  });

  await waClient.initialize();
  return { success: true };
};

export const disconnectSession = async (clientId) => {
  const waClient = clients.get(clientId);
  if (waClient) {
    try {
      await waClient.destroy();
    } catch (e) {}
    clients.delete(clientId);
  }

  await WhatsappSession.findOneAndUpdate(
    { clientId },
    { status: "disconnected", phone: "" }
  );

  return { success: true };
};

export const getStatus = async (clientId) => {
  const session = await WhatsappSession.findOne({ clientId });
  if (!session) return { status: "disconnected", phone: "" };
  return { status: session.status, phone: session.phone, lastConnected: session.lastConnected };
};

export const sendMessage = async (clientId, phone, message) => {
  const waClient = clients.get(clientId);
  if (!waClient) return { success: false, error: "WhatsApp not connected" };

  const chatId = formatPhone(phone);
  if (!chatId) return { success: false, error: "Invalid phone number" };

  try {
    await waClient.sendMessage(chatId, message);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const broadcastToWebinar = async (clientId, webinarId, messageTemplate) => {
  const registrations = await Registration.find({ webinar: webinarId }).lean();
  const withPhone = registrations.filter((r) => r.phone);

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const reg of withPhone) {
    const personalMessage = messageTemplate
      .replace(/\{name\}/g, `${reg.firstname || ""} ${reg.lastname || ""}`.trim() || "there")
      .replace(/\{email\}/g, reg.email || "");

    const result = await sendMessage(clientId, reg.phone, personalMessage);
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push({ phone: reg.phone, error: result.error });
    }

    // Rate limit: 1.5s between messages to avoid WhatsApp ban
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return { total: withPhone.length, sent, failed, errors };
};

// Restore previously connected sessions on server boot
export const restoreSessions = async () => {
  try {
    const activeSessions = await WhatsappSession.find({ status: "connected" });
    for (const session of activeSessions) {
      console.log(`Restoring WhatsApp session for client ${session.clientId}...`);
      try {
        await initSession(session.clientId.toString(), session.userId.toString());
      } catch (err) {
        console.error(`Failed to restore session for ${session.clientId}:`, err.message);
        await WhatsappSession.findOneAndUpdate(
          { clientId: session.clientId },
          { status: "disconnected" }
        );
      }
    }
  } catch (err) {
    console.error("Session restore error:", err.message);
  }
};
