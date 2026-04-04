import cron from "node-cron";
import Message from "../models/message.js";
import ClientProfile from "../models/clientProfile.js";
import Webinar from "../models/webinar.js";
import { sendEmail } from "./emailService.js";

// ==================== WEBINAR AUTO-STATUS UPDATE (every minute) ====================
cron.schedule("* * * * *", async () => {
  const now = new Date();

  try {
    // scheduled/published → live (webinar start time has passed)
    await Webinar.updateMany(
      {
        status: { $in: ["scheduled", "published"] },
        webinarDateTime: { $lte: now },
      },
      { $set: { status: "live" } }
    );

    // live → completed (webinar end time has passed)
    const liveWebinars = await Webinar.find({ status: "live" });

    for (const webinar of liveWebinars) {
      const endTime = new Date(
        webinar.webinarDateTime.getTime() + webinar.durationMinutes * 60 * 1000
      );
      if (now >= endTime) {
        webinar.status = "completed";
        await webinar.save();
      }
    }
  } catch (error) {
    console.error("Webinar status cron error:", error.message);
  }
});

cron.schedule("*/2 * * * *", async () => {
  const now = new Date();

  try {

    // SUBSCRIPTION REMINDER 
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringClients = await ClientProfile.find({
      subscriptionValidTill: {
        $lte: tomorrow,
        $gte: now,
      },
    }).populate("user subscription");

    for (const profile of expiringClients) {
      const alreadyExists = await Message.findOne({
        user: profile.user._id,
        type: "subscription_reminder",
        status: "pending",
      });

      if (alreadyExists) continue;

      await Message.create({
        user: profile.user._id,
        email: profile.user.email,
        type: "subscription_reminder",
        channels: ["email"],
        subject: "Subscription Expiring Soon",
        body: `
          Hi ${profile.user.firstname} ${profile.user.lastname || ""},
          Your ${profile.subscription?.name || "plan"} will expire tomorrow.
          Renew now to continue using Enrollify.
        `,
        scheduledFor: now,
        status: "pending",
      });
    }

    // 📩 EXISTING MESSAGE SENDER
    const pendingMessages = await Message.find({
      status: "pending",
      scheduledFor: { $lte: now },
    })
      .limit(20)
      .populate("user");

    await Promise.all(
      pendingMessages.map(async (msg) => {
        try {
          if (msg.channels && msg.channels.includes("email")) {
            await sendEmail({
              to: msg.email || (msg.user && msg.user.email),
              subject: msg.subject,
              html: msg.body,
            });
          }

          msg.status = "sent";
          msg.sentAt = now;
          await msg.save();

          console.log("✅ Message sent:", msg.type);

        } catch (err) {
          msg.status = "failed";
          msg.error = err.message;
          await msg.save();

          console.log("❌ Message failed:", err.message);
        }
      })
    );

  } catch (error) {
    console.log("Cron error:", error.message);
  }
});