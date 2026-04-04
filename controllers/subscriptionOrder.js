import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import Subscription from "../models/subscription.js";
import ClientProfile from "../models/clientProfile.js";
import { generateSubdomain } from "../utils/generateSubdomain.js";
import Payment from "../models/payment.js";
import { getIO } from "../utils/socket.js";

// CREATE ORDER
export const createProfileAndOrder = async (req, res) => {
  // console.log("BODY:", req.body);
  try {
    const {
      subscriptionId,
      first_name,
      last_name,
      Organization_Name,
      phone,
      bankDetails,
      upiId,
      gstNumber
    } = req.body;
    if (!first_name || !last_name || !Organization_Name || !phone) {
      return res.status(400).json({
        msg: "Required fields missing",
      });
    }

    const plan = await Subscription.findById(subscriptionId);

    if (!plan) {
      return res.status(404).json({
        msg: "Plan not found",
      });
    }

    const subdomain = generateSubdomain(Organization_Name);

    // ✅ Save profile first
    const profile = await ClientProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          user: req.user.id,
          first_name,
          last_name,
          Organization_Name,
          phone,
          bankDetails,
          upiId,
          gstNumber,
          subdomain
        }
      },
      {
        upsert: true,
        new: true,
      }
    );

    // ✅ Create Razorpay Order
    const receiptString = `sub_${subscriptionId.substring(16)}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: receiptString
    });

    res.json({
      success: true,
      message: "Profile saved & order created",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: plan.name,
      profile
    });

  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || (error.error && error.error.description) || "Failed to create order",
      errorDetails: error
    });
  }
};


// VERIFY PAYMENT
export const verifySubscriptionPayment = async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionId
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const profile = await ClientProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          subscription: subscriptionId,
          subscriptionValidTill: expiryDate
        }
      },
      { new: true }
    );

    const plan = await Subscription.findById(subscriptionId);

    if (plan) {
      await Payment.create({
        client: profile._id,
        subscription: subscriptionId,
        amount: plan.price,
        paymentId: razorpay_payment_id,
        status: "paid"
      });
    }

    // Notify admin of new subscription
    try {
      const io = getIO();
      io.to("admin").emit("new-subscription", {
        userId: req.user.id,
        planName: plan?.name,
        amount: plan?.price,
        timestamp: new Date(),
      });
    } catch (socketErr) {}

    res.json({
      success: true,
      message: "Subscription activated successfully",
      profile
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};