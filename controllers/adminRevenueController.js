import Payment from "../models/payment.js";
import Registration from "../models/registration.js";
import dayjs from "dayjs";

export const getAdminRevenue = async (req, res) => {
  try {
    const thirtyDaysAgo = dayjs().subtract(30, "days").toDate();

    // 🔹 TREND
    const webinarTrend = await Registration.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amountPaid" }
        }
      }
    ]);

    const subTrend = await Payment.aggregate([
      { $match: { status: "paid", paidAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
          total: { $sum: "$amount" }
        }
      }
    ]);

    const trendMap = {};
    for (let i = 0; i < 30; i++) {
      const d = dayjs().subtract(i, "days").format("YYYY-MM-DD");
      trendMap[d] = 0;
    }

    webinarTrend.forEach(t => {
      if (trendMap[t._id] !== undefined) trendMap[t._id] += t.total;
    });

    subTrend.forEach(t => {
      if (trendMap[t._id] !== undefined) trendMap[t._id] += t.total;
    });

    const revenueTrend = Object.keys(trendMap).sort().map(date => ({
      date,
      amount: trendMap[date]
    }));

    // 🔹 TOTALS (for cards UI)
    const totalWebinarRevenue = await Registration.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } }
    ]);

    const totalSubRevenue = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const webinarRevenue = totalWebinarRevenue[0]?.total || 0;
    const subscriptionRevenue = totalSubRevenue[0]?.total || 0;

    // 🔹 SPLIT (for pie chart)
    const revenueSplit = [
      { label: "Webinars", value: webinarRevenue },
      { label: "Subscriptions", value: subscriptionRevenue }
    ];

    // 🔹 LEDGER (UI ready)
    const registrations = await Registration.find()
      .populate("user", "firstname lastname")
      .populate("webinar", "title")
      .sort({ createdAt: -1 })
      .lean();

    const payments = await Payment.find()
      .populate("client", "first_name last_name")
      .populate("subscription", "name")
      .sort({ paidAt: -1 })
      .lean();

    const ledger = [
      ...registrations.map(r => ({
        id: r._id,

        transaction: {
          id: r.razorpayPaymentId || r._id,
          date: r.createdAt
        },

        entity: {
          name: r.user
            ? `${r.user.firstname} ${r.user.lastname}`
            : "Student",
          type: "Student"
        },

        type: "Webinar",

        item: r.webinar?.title || "Unknown",

        amount: r.amountPaid,

        status:
          r.paymentStatus === "paid" || r.paymentStatus === "free"
            ? "Success"
            : r.status === "cancelled"
            ? "Failed"
            : "Pending"
      })),

      ...payments.map(p => ({
        id: p._id,

        transaction: {
          id: p.paymentId || p._id,
          date: p.paidAt
        },

        entity: {
          name: p.client
            ? `${p.client.first_name} ${p.client.last_name}`
            : "Creator",
          type: "Creator"
        },

        type: "Subscription",

        item: p.subscription?.name || "Plan",

        amount: p.amount,

        status:
          p.status === "paid"
            ? "Success"
            : p.status === "failed"
            ? "Failed"
            : "Pending"
      }))
    ].sort((a, b) => new Date(b.transaction.date) - new Date(a.transaction.date));

    // ✅ FINAL RESPONSE
    res.json({
      success: true,
      data: {
        cards: {
          totalRevenue: webinarRevenue + subscriptionRevenue,
          webinarRevenue,
          subscriptionRevenue
        },

        charts: {
          revenueTrend,
          revenueSplit
        },

        table: ledger
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};