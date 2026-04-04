import Review from "../models/review.js";
import Webinar from "../models/webinar.js";

/* Create Review */
export const createReview = async (req, res) => {
  try {
    const { webinarId, rating, comment } = req.body;

    if (!webinarId) {
      return res.status(400).json({ msg: "Webinar ID is required" });
    }

    if (!rating) {
      return res.status(400).json({ msg: "Rating is required" });
    }

    const review = await Review.create({
      webinar: webinarId,
      user: req.user._id,
      rating,
      comment,
    });

    res.status(201).json({
      msg: "Review added successfully",
      review,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* Get Reviews (Admin + Client) */
export const getReviews = async (req, res) => {
  try {

    let reviews;

    // ADMIN → see all reviews
    if (req.user.role === "admin") {
      reviews = await Review.find()
        .populate("user", "name")
        .populate("webinar", "title");
    }

    // CLIENT → only their webinar reviews
    if (req.user.role === "client") {

      const webinars = await Webinar.find({ createdBy: req.user._id });

      const webinarIds = webinars.map(w => w._id);

      reviews = await Review.find({
        webinar: { $in: webinarIds }
      })
        .populate("user", "name")
        .populate("webinar", "title");
    }

    res.json(reviews);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};