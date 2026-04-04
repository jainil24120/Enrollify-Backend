import Webinar from "../../models/webinar.js";
import Registration from "../../models/registration.js";

export const getAudience = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all webinars created by this client
    const webinars = await Webinar.find({ createdBy: userId }).select("_id title");
    const webinarIds = webinars.map(w => w._id);

    if (webinarIds.length === 0) {
      return res.json([]);
    }

    // Get all registrations for this client's webinars
    const registrations = await Registration.find({
      webinar: { $in: webinarIds },
    })
      .populate("webinar", "title price")
      .sort({ createdAt: -1 });

    // Group by email to get unique audience members with aggregated data
    const audienceMap = {};

    for (const reg of registrations) {
      const key = reg.email.toLowerCase();

      if (!audienceMap[key]) {
        audienceMap[key] = {
          _id: reg._id,
          firstname: reg.firstname,
          lastname: reg.lastname || "",
          email: reg.email,
          phone: reg.phone,
          city: reg.city || "",
          totalSpent: 0,
          webinarsAttended: 0,
          webinars: [],
          createdAt: reg.createdAt,
        };
      }

      audienceMap[key].totalSpent += reg.amountPaid || 0;
      audienceMap[key].webinarsAttended += 1;
      audienceMap[key].webinars.push({
        title: reg.webinar?.title || "Unknown",
        amountPaid: reg.amountPaid || 0,
        paymentStatus: reg.paymentStatus,
        date: reg.createdAt,
      });

      // Keep the earliest registration date
      if (reg.createdAt < audienceMap[key].createdAt) {
        audienceMap[key].createdAt = reg.createdAt;
      }
    }

    const audience = Object.values(audienceMap);

    res.json(audience);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
