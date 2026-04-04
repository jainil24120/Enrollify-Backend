import Webinar from "../../models/webinar.js";
import Registration from "../../models/registration.js";

export const getWebinarStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const webinars = await Webinar.find({ createdBy: userId });

    const stats = await Promise.all(
      webinars.map(async (webinar) => {

        const enrollments = await Registration.countDocuments({
          webinar: webinar._id
        });

        const revenue = await Registration.aggregate([
          {
            $match: {
              webinar: webinar._id,
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

        return {
          webinarId: webinar._id,
          title: webinar.title,
          enrollments,
          revenue: revenue[0]?.total || 0
        };
      })
    );

    res.json(stats);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};