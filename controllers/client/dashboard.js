import Webinar from "../../models/webinar.js";
import Registration from "../../models/registration.js";

export const getClientDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const webinars = await Webinar.find({ createdBy: userId });

    const webinarIds = webinars.map(w => w._id);

    const totalUsers = await Registration.countDocuments({
      webinar: { $in: webinarIds }
    });

    const revenue = await Registration.aggregate([
      {
        $match: {
          webinar: { $in: webinarIds },
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amountPaid" }
        }
      }
    ]);

    res.json({
      totalWebinars: webinars.length,
      totalUsers,
      totalRevenue: revenue[0]?.total || 0,
      activeWebinars: webinars.filter(w => w.status === "scheduled").length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};