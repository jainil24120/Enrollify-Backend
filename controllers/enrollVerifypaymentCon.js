import crypto from "crypto";
import Webinar from "../models/webinar.js";
import { registerUserToWebinar } from "../services/registerService.js";
import razorpay from "../config/razorpay.js";
import User from "../models/users.js";

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      webinarId,
      guestData: bodyGuestData
    } = req.body;

    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
  
    if (sign !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment failed"
      });
    }

    const webinar = await Webinar.findById(webinarId).populate("clients");
    
    let guestData = bodyGuestData;

    if (!guestData) {
      if (razorpay_order_id) {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        if (order && order.notes) {
          guestData = {
            user: order.notes.userId || null,
            firstname: order.notes.firstname,
            lastname: order.notes.lastname,
            email: order.notes.email,
            phone: order.notes.phone,
            city: order.notes.city,
            paymentMethod: order.notes.paymentMethod,
            upiId: order.notes.upiId,
            cardNumber: order.notes.cardNumber
          };
        }
      }
    }

    if (!guestData || !guestData.email) {
      return res.status(404).json({ success: false, message: "Guest details not found for registration" });
    }

    const result = await registerUserToWebinar({
      guestData,
      webinar,
      razorpay_payment_id,
      razorpay_order_id
    });

    res.json({
      success: true,
      message: "Payment success & registered 🎉",
      ...result
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};