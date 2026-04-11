import dayjs from "dayjs";
import Message from "../models/message.js";
import Registration from "../models/registration.js";
import ClientProfile from "../models/clientProfile.js";
import WhatsappSession from "../models/whatsappSession.js";
import { sendEmail } from "../utils/emailService.js";
import { getIO } from "../utils/socket.js";
import * as whatsappService from "./whatsappService.js";

export const registerUserToWebinar = async ({ guestData, webinar, razorpay_payment_id, razorpay_order_id }) => {

  // 🔁 Already registered check
  const exists = await Registration.findOne({
    email: guestData.email.toLowerCase(),
    webinar: webinar._id
  });

  if (exists) {
    return { already: true };
  }

  // ✅ FIXED CLIENT FETCH
  const clientProfile = await ClientProfile.findById(webinar.clients);

  if (!clientProfile) {
    throw new Error("Client profile not found");
  }

  // ✅ Create registration
  const registration = await Registration.create({
    user: guestData.user || null,
    firstname: guestData.firstname,
    lastname: guestData.lastname,
    email: guestData.email.toLowerCase(),
    phone: guestData.phone,
    city: guestData.city,
    paymentMethod: guestData.paymentMethod,
    upiId: guestData.upiId,
    cardNumber: guestData.cardNumber,
    webinar: webinar._id,
    paymentStatus: webinar.price > 0 ? "paid" : "free",
    amountPaid: webinar.price || 0,
    razorpayPaymentId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id
  });

  const webinarPageLink = `https://enrollify.xyz/w/${webinar.slug}`;
  const webinarDate = new Date(webinar.webinarDateTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });
  const isPaid = webinar.price > 0;
  const orgName = clientProfile.Organization_Name || "the host";

  await sendEmail({
    to: guestData.email.toLowerCase(),
    subject: `Registration Confirmed — ${webinar.title}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">

        <div style="background: linear-gradient(135deg, #6574e9, #4f5cd4); padding: 32px 28px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 6px 0;">Registration Confirmed</h1>
          <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">Your seat has been reserved</p>
        </div>

        <div style="padding: 28px;">
          <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
            Hi <strong>${guestData.firstname || "there"}</strong>,<br/>
            You have successfully registered for the following webinar hosted by <strong>${orgName}</strong>.
          </p>

          <div style="background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #1a1a35; margin: 0 0 12px 0;">${webinar.title}</h2>
            ${webinar.subtitle ? `<p style="font-size: 13px; color: #6b7280; margin: 0 0 14px 0;">${webinar.subtitle}</p>` : ""}

            <table style="width: 100%; font-size: 14px; color: #374151; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: 600; width: 140px; vertical-align: top;">Date & Time</td>
                <td style="padding: 6px 0;">${webinarDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">Duration</td>
                <td style="padding: 6px 0;">${webinar.durationMinutes || 60} minutes</td>
              </tr>
              ${webinar.language ? `
              <tr>
                <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">Language</td>
                <td style="padding: 6px 0;">${webinar.language}</td>
              </tr>` : ""}
              ${webinar.speakerName ? `
              <tr>
                <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">Speaker</td>
                <td style="padding: 6px 0;">${webinar.speakerName}</td>
              </tr>` : ""}
              ${isPaid ? `
              <tr>
                <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">Amount Paid</td>
                <td style="padding: 6px 0; color: #10b981; font-weight: 700;">&#8377;${webinar.price}</td>
              </tr>` : `
              <tr>
                <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">Ticket</td>
                <td style="padding: 6px 0; color: #10b981; font-weight: 700;">Free</td>
              </tr>`}
              ${razorpay_payment_id ? `
              <tr>
                <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">Payment ID</td>
                <td style="padding: 6px 0; font-size: 12px; color: #6b7280;">${razorpay_payment_id}</td>
              </tr>` : ""}
            </table>
          </div>

          ${webinar.meetingLink ? `
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${webinar.meetingLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6574e9, #4f5cd4); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Join Webinar
            </a>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">This link will be active at the scheduled time</p>
          </div>` : ""}

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${webinarPageLink}" style="display: inline-block; padding: 10px 24px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 13px; border: 1px solid #e5e7eb;">
              View Webinar Details
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            This is an automated confirmation from <strong>Enrollify</strong> on behalf of <strong>${orgName}</strong>.<br/>
            If you did not register for this webinar, please ignore this email.
          </p>
        </div>
      </div>
    `
  });

  // 💬 WhatsApp seat confirmation (if client has WhatsApp connected)
  try {
    const waSession = await WhatsappSession.findOne({
      clientId: clientProfile._id,
      status: "connected",
    });
    if (waSession && guestData.phone) {
      const waMsg = `Hi ${guestData.firstname || "there"}! Your seat is confirmed for *${webinar.title}*\n\nDate: ${new Date(webinar.webinarDateTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n${webinar.meetingLink ? `Join: ${webinar.meetingLink}` : ""}\n\nSee you there!`;
      await whatsappService.sendMessage(clientProfile._id.toString(), guestData.phone, waMsg);
    }
  } catch (waErr) {
    // WhatsApp failure should never break registration
    console.error("WA confirmation error:", waErr.message);
  }

  // Determine channels based on WhatsApp availability
  const hasWA = await WhatsappSession.findOne({ clientId: clientProfile._id, status: "connected" }).lean();
  const channels = hasWA && guestData.phone ? ["email", "whatsapp"] : ["email"];

  // ⏰ Reminder messages
  const messages = [
    {
      type: "registration_confirmation",
      scheduledFor: new Date(),
      subject: "🎉 Registration Confirmed",
      body: `You're registered for ${webinar.title}`,
    },
    {
      type: "reminder_1_day",
      scheduledFor: dayjs(webinar.webinarDateTime)
        .subtract(1, "day")
        .toDate(),
      subject: "⏰ Tomorrow Reminder",
      body: `Your webinar is tomorrow`,
    },
    {
      type: "reminder_15_min",
      scheduledFor: dayjs(webinar.webinarDateTime)
        .subtract(15, "minute")
        .toDate(),
      subject: "🚀 Starting Soon",
      body: `Webinar starts in 15 min`,
    }
  ];

  const now = new Date();

  const validMessages = messages.filter(m => m.scheduledFor > now);

  await Message.insertMany(
    validMessages.map(msg => ({
      webinar: webinar._id,
      user: guestData.user || null,
      email: guestData.email.toLowerCase(),
      phone: guestData.phone || "",
      channels,
      ...msg,
    }))
  );

  // Emit real-time events
  try {
    const io = getIO();

    // Notify the webinar creator
    io.to(`user_${webinar.createdBy}`).emit("new-registration", {
      webinarId: webinar._id,
      webinarTitle: webinar.title,
      attendeeName: `${guestData.firstname} ${guestData.lastname}`,
      attendeeEmail: guestData.email,
      paymentStatus: webinar.price > 0 ? "paid" : "free",
      amountPaid: webinar.price || 0,
      timestamp: new Date(),
    });

    // Update live attendee count for anyone viewing this webinar
    const attendeeCount = await Registration.countDocuments({ webinar: webinar._id });
    io.to(`webinar_${webinar._id}`).emit("attendee-count", {
      webinarId: webinar._id,
      count: attendeeCount,
    });

    // Notify admin dashboard
    io.to("admin").emit("new-registration", {
      webinarId: webinar._id,
      webinarTitle: webinar.title,
      attendeeName: `${guestData.firstname} ${guestData.lastname}`,
      timestamp: new Date(),
    });
  } catch (socketErr) {
    // Socket errors should not break registration flow
  }

  return { registration };
};