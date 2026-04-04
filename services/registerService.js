import dayjs from "dayjs";
import Message from "../models/message.js";
import Registration from "../models/registration.js";
import ClientProfile from "../models/clientProfile.js";
import { sendEmail } from "../utils/emailService.js";
import { getIO } from "../utils/socket.js";

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

  const webinarLink = `https://${clientProfile.subdomain}.enrollify.com/webinar/${webinar._id}`;

  // 📧 Email send
  await sendEmail({
    to: guestData.email.toLowerCase(),
    subject: "🎉 Webinar Registration Confirmed",
    html: `
      <h2>You are successfully registered!</h2>
      <p><strong>Topic:</strong> ${webinar.title}</p>
      <p><strong>Date & Time:</strong> ${new Date(webinar.webinarDateTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
      <p>
        <strong>Webinar Dashboard:</strong><br/>
        <a href="${webinarLink}">${webinarLink}</a>
      </p>
      ${webinar.meetingLink ? `
      <p>
        <strong>Live Meeting Link:</strong><br/>
        <a href="${webinar.meetingLink}">Click here to join the live meeting</a>
      </p>
      ` : ""}
    `
  });

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
      channels: ["email"],
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