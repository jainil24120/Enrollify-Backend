import User from "../models/users.js";
import Webinar from "../models/webinar.js";
import Registration from "../models/registration.js";
import ClientProfile from "../models/clientProfile.js";
import { getSubscriptionStats } from "../utils/subscriptionUtils.js";

export const getAdminAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalClients,
      totalWebinars,
      totalRegistrations,
      revenueAgg,
      stats
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "client" }),
      Webinar.countDocuments(),
      Registration.countDocuments(),
      Registration.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } }
      ]),
      getSubscriptionStats()
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    // 🔥 EXPIRED CLIENT DETAILS
    const expiredClients = await ClientProfile.find(stats.expiredQuery)
      .populate("user", "firstname lastname email")
      .sort({ subscriptionValidTill: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        cards: {
          totalUsers,
          totalClients,
          totalWebinars,
          totalRegistrations,
          totalRevenue,
          activeSubscriptions: stats.activeCount,
          expiredSubscriptions: stats.expiredCount,
          churnRate: stats.churnRate
        },

        expiredClients: expiredClients.map(c => ({
          id: c._id,
          name: `${c.user?.firstname || ""} ${c.user?.lastname || ""}`,
          email: c.user?.email,
          expiredOn: c.subscriptionValidTill
        }))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};