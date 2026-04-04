import ClientProfile from "../models/clientProfile.js";

export const checkActiveSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        msg: "Unauthorized",
      });
    }

    const profile = await ClientProfile.findOne({
      user: req.user._id,
    }).populate("subscription");

    if (!profile || !profile.subscription) {
      return res.status(403).json({
        msg: "No active subscription plan",
      });
    }

    if (
      !profile.subscriptionValidTill ||
      new Date() > profile.subscriptionValidTill
    ) {
      return res.status(403).json({
        msg: "Subscription expired. Please renew.",
      });
    }

    req.subscription = profile.subscription;
    next();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};