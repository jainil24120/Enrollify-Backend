import ClientProfile from "../../models/clientProfile.js";

export const getSubscription = async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({
      user: req.user._id
    }).populate("subscription");

    if (!profile) {
      return res.status(404).json({
        message: "Client profile not found"
      });
    }

    res.json(profile);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};