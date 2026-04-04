import Registration from "../models/registration.js";

export const checkWebinarAccess = async (req, res, next) => {
  try {
    const { webinarId } = req.params;

    const registration = await Registration.findOne({
      user: req.user._id,
      webinar: webinarId,
      paymentStatus: { $in: ["paid", "free"] },
      status: "registered"
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Please register or purchase this webinar."
      });
    }

    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
