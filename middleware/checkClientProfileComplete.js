import ClientProfile from "../models/clientProfile.js";

export const checkClientProfileComplete = async (req, res, next) => {
  try {
    // Only for client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Client only",
      });
    }

    const profile = await ClientProfile.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: "Please create your client profile first",
      });
    }

    // ✅ Basic fields check
    const basicComplete =
      profile.first_name &&
      profile.last_name &&
      profile.Organization_Name &&
      profile.phone;

    if (!basicComplete) {
      return res.status(400).json({
        success: false,
        message: "Please complete your basic profile details",
      });
    }

    // ✅ Bank OR UPI check
    const hasBank =
      profile.bankDetails &&
      Object.values(profile.bankDetails).some((v) => v);

    const hasUpi = !!profile.upiId;

    if (!hasBank && !hasUpi) {
      return res.status(400).json({
        success: false,
        message: "Please add bank details or UPI ID to continue",
      });
    }

    // Attach profile for next controllers
    req.clientProfile = profile;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};