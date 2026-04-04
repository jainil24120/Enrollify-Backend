import razorpay from "../config/razorpay.js";
import Webinar from "../models/webinar.js";
import { registerUserToWebinar } from "../services/registerService.js";

export const enrollWebinar = async (req, res) => {
  try {
    const { webinarId, firstName, lastName, email, phone, city, paymentMethod, upiId, cardNumber, userId } = req.body;


    if (!webinarId) {
      return res.status(400).json({
        success: false,
        message: "webinarId is required"
      });
    }

    const webinar = await Webinar.findById(webinarId).populate("clients");

    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: "Webinar not found"
      });
    }

    if (!email || !firstName || !phone) {
        return res.status(400).json({ success: false, message: "Incomplete details provided for registration." });
    }

    const guestData = {
        user: userId || null,
        firstname: firstName,
        lastname: lastName || "",
        email: email.toLowerCase(),
        phone,
        city: city || "",
        paymentMethod: paymentMethod || "",
        upiId: upiId || "",
        cardNumber: cardNumber || ""
    };

    // 🟢 FREE WEBINAR
    if (!webinar.price || webinar.price <= 0) {
      const result = await registerUserToWebinar({ guestData, webinar });

      if (result.already) {
        return res.status(409).json({
          success: false,
          already: true,
          message: "You are already registered for this webinar."
        });
      }

      return res.json({
        success: true,
        type: "free",
        ...result
      });
    }

    // 🔴 PAID → create order
    const order = await razorpay.orders.create({
      amount: webinar.price * 100,
      currency: "INR",
      receipt: `web_${Date.now().toString().slice(-6)}`,
      notes: {
        webinarId: webinar._id.toString(),
        userId: guestData.user || "",
        firstname: guestData.firstname.substring(0, 255),
        lastname: guestData.lastname.substring(0, 255),
        email: guestData.email.substring(0, 255),
        phone: guestData.phone.substring(0, 255),
        city: guestData.city.substring(0, 255),
        paymentMethod: guestData.paymentMethod.substring(0, 255),
        upiId: guestData.upiId.substring(0, 255),
        cardNumber: guestData.cardNumber.substring(0, 255)
      }
    });

    res.json({
      success: true,
      type: "paid",
      orderId: order.id,
      amount: order.amount,
      webinarId,
      guestData
    });

  } catch (err) {
    console.error("ENROLL ERROR 👉", err); // 👈 important

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};