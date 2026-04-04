import Webinar from "../../models/webinar.js";
import Registration from "../../models/registration.js";

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const webinars = await Webinar.find({ createdBy: userId });
    const ids = webinars.map(w => w._id);

    const data = await Registration.aggregate([
      {
        $match: {
          webinar: { $in: ids }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1, "_id.day": 1 } }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};