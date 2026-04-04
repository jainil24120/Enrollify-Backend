import User from "../models/users.js";
import Webinar from "../models/webinar.js";
import Registration from "../models/registration.js"
import Review from "../models/review.js";
import ClientProfile from "../models/clientProfile.js";
import Subscription from "../models/subscription.js";
import { getSubscriptionStats } from "../utils/subscriptionUtils.js";
import dayjs from "dayjs";

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.json({
            success: true,
            count: users.length,
            data: users
        })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getAllWebinars = async (req, res) => {
    try {
        const webinars = await Webinar.find()
            .populate("createdBy", "firstname lastname email")
            .populate("clients", "Organization_Name");

        res.json({
            success: true,
            count: webinars.length,
            data: webinars
        })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getAllRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find()
            .populate("user", "firstname lastname email")
            .populate("webinar", "title  webinarDateTime");

        res.json({
            success: true,
            count: registrations.length,
            data: registrations
        })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message }); // fixed error.message to err.message
    }
};

export const getAdminUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCreators = await User.countDocuments({ role: "client" });

    const activeSubscriptions = await ClientProfile.countDocuments({
      subscriptionValidTill: { $gte: new Date() },
      isActive: true
    });

    const thirtyDaysAgo = dayjs().subtract(30, "days").toDate();
    const newSignups = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const bannedUsers = await ClientProfile.countDocuments({ isActive: false });

    const creators = await ClientProfile.find()
      .populate("user", "firstname lastname email createdAt")
      .populate("subscription", "name price")
      .lean();

    const creatorData = await Promise.all(
      creators.map(async (creator) => {
        const webinarsCount = await Webinar.countDocuments({
          createdBy: creator.user?._id
        });

        const webinars = await Webinar.find({
          createdBy: creator.user?._id
        }).select("_id");

        const webinarIds = webinars.map((w) => w._id);

        const revenueAgg = await Registration.aggregate([
          {
            $match: {
              webinar: { $in: webinarIds },
              paymentStatus: "paid"
            }
          },
          { $group: { _id: null, total: { $sum: "$amountPaid" } } }
        ]);

        const revenue = revenueAgg[0]?.total || 0;

        return {
          id: creator._id,

          userInfo: {
            name: `${creator.user?.firstname || ""} ${creator.user?.lastname || ""}`,
            email: creator.user?.email,
            avatar: creator.user?.firstname?.charAt(0).toUpperCase()
          },

          plan: creator.subscription?.name || "Free",

          joinedDate: creator.user?.createdAt,

          stats: {
            webinars: webinarsCount,
            revenue
          },

          status: creator.isActive ? "Active" : "Suspended"
        };
      })
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCreators,
          activeSubscriptions,
          newSignups,
          bannedUsers
        },
        table: creatorData
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminSubscriptions = async (req, res) => {
  try {
    const {
      now,
      activeQuery,
      expiredQuery,
      activeCount,
      expiredCount,
      churnRate
    } = await getSubscriptionStats();

    // 🔹 MRR
    const activeClients = await ClientProfile.find(activeQuery)
      .populate("subscription", "price");

    const mrr = activeClients.reduce((acc, c) => {
      return acc + (c.subscription?.price || 0);
    }, 0);

    // 🔹 MOST POPULAR PLAN
    const popularAgg = await ClientProfile.aggregate([
      { $match: activeQuery },
      { $group: { _id: "$subscription", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "_id",
          as: "subDetails"
        }
      },
      { $unwind: "$subDetails" }
    ]);

    const mostPopularPlan =
      popularAgg.length > 0
        ? {
            name: popularAgg[0].subDetails.name,
            price: popularAgg[0].subDetails.price,
            percentage: Math.round(
              (popularAgg[0].count / activeCount) * 100
            )
          }
        : null;

    // 🔹 TABLE
    const subscriptions = await ClientProfile.find()
      .populate("user", "firstname lastname email")
      .populate("subscription", "name price duration")
      .lean();

    const table = subscriptions.map((sub) => {
      const isPastDue =
        sub.subscriptionValidTill &&
        sub.subscriptionValidTill < now;

      return {
        id: sub._id,
        creatorInfo: {
          name: `${sub.user?.firstname || ""} ${sub.user?.lastname || ""}`,
          email: sub.user?.email
        },
        plan: sub.subscription?.name || "Free",
        billing: sub.subscription
          ? `₹${sub.subscription.price}/${
              sub.subscription.duration === "monthly" ? "Month" : "Year"
            }`
          : "₹0/Month",
        nextBilling: sub.subscriptionValidTill,
        status: isPastDue || !sub.isActive ? "Past Due" : "Active"
      };
    });

    res.json({
      success: true,
      data: {
        stats: {
          activeSubscriptions: activeCount,
          expiredCount,
          churnRate,
          mrr,
          mostPopularPlan
        },
        table
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};