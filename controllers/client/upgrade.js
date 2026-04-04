import razorpay from "../../config/razorpay.js";
import Subscription from "../../models/subscription.js";

export const upgradeSubscription = async (req, res) => {
  try {
    const { planId } = req.body;

    const plan = await Subscription.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `upgrade_${req.user._id}_${Date.now()}`
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      plan
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};