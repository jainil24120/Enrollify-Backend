import ClientProfile from "../models/clientProfile.js";
import { generateSubdomain } from "../utils/generateSubdomain.js";

// CREATE / UPDATE PROFILE
export const createClientProfile = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      Organization_Name,
      subdomain: requestedSubdomain,
      phone,
      bankDetails,
      upiId,
      gstNumber
    } = req.body;

    if (!first_name || !last_name || !Organization_Name || !phone) {
      return res.status(400).json({
        msg: "Required fields missing",
      });
    }

    const existing = await ClientProfile.findOne({ user: req.user.id });

    let subdomain;
    if (requestedSubdomain) {
      subdomain = requestedSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");
    } else if (existing) {
      subdomain = existing.subdomain;
    } else {
      subdomain = generateSubdomain(Organization_Name);
    }

    // Check if taken by different active user
    const taken = await ClientProfile.findOne({ subdomain, user: { $ne: req.user.id } });
    if (taken) {
      const isExpired = taken.subscriptionValidTill && new Date(taken.subscriptionValidTill) < new Date();
      if (!isExpired) {
        return res.status(400).json({ msg: "Subdomain is already taken. Please choose another." });
      }
      await ClientProfile.findByIdAndUpdate(taken._id, { $set: { subdomain: taken.subdomain + "-expired-" + Date.now() } });
    }

    const profile = await ClientProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          user: req.user.id,
          first_name,
          last_name,
          Organization_Name,
          phone,
          bankDetails,
          upiId,
          gstNumber,
          subdomain
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      msg: "Client profile saved successfully ✅",
      clientProfileId: profile._id,
      website: `https://${profile.subdomain}.enrollify.com`,
      profile,
    });

  } catch (err) {
    res.status(400).json({
      error: err.message || "Failed to save client profile",
    });
  }
};
// CLIENT apna profile dekhe
export const getMyClientProfile = async (req, res) => {
  try {
    // if (req.user.role !== "client") {
    //   return res.status(403).json({ msg: "Client only" });
    // }

    const profile = await ClientProfile.findOne({
      user: req.user.id,
    }).populate("user", "firstname lastname email");

    if (!profile) {
      return res.status(404).json({
        msg: "Client profile not found",
      });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({
      error: err.message || "Failed to fetch client profile",
    });
  }
};
