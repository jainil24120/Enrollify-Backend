import Subscription from "../models/subscription.js";

// ADMIN → CREATE SUBSCRIPTION
export const createSubscription = async (req, res) => {
  try {

    // ✅ Role check
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create subscription plans",
      });
    }

    const { name, price } = req.body;

    // ✅ Basic validation
    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required",
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    const subscription = await Subscription.create(req.body);

    res.status(201).json({
      success: true,
      message: "Subscription created successfully ✅",
      data: subscription,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// ADMIN → UPDATE SUBSCRIPTION
export const updateSubscription = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update subscription plans",
      });
    }

    const { id } = req.params;

    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    const updatedPlan = await Subscription.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully ✅",
      data: updatedPlan
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};
// PUBLIC → GET ALL SUBSCRIPTIONS
export const getAllSubscriptions = async (req, res) => {
  try {

    const subscriptions = await Subscription.find({
      status: "active"
    });

    res.status(200).json({
      success: true,
      data: subscriptions,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};