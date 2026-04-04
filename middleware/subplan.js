import ClientProfile from "../models/clientProfile.js";

export const paidOnly = async (req, res, next) => {
  try {
    const profile = await ClientProfile.findOne({ user: req.user.id }).populate(
      "subscription"
    );

    // No profile or no subscription → blocked
    if (!profile) {
      return res.status(403).json({
        success: false,
        message: "Upgrade your plan",
      });
    }

    if (!profile.subscription) {
      return res.status(403).json({
        success: false,
        message: "Upgrade your plan",
      });
    }

    // Check if subscription has expired
    if (profile.subscriptionValidTill && new Date() > profile.subscriptionValidTill) {
      return res.status(403).json({
        success: false,
        message: "Subscription expired. Please renew.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
