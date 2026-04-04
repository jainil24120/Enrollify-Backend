import ClientProfile from "../models/clientProfile.js";

export const detectClient = async (req, res, next) => {
  try {

    const host = req.headers.host;

    // example: rpsolutions.enrollify.com
    const subdomain = host.split(".")[0];

    // ignore main domain
    if (subdomain === "www" || subdomain === "enrollify") {
      return next();
    }

    const client = await ClientProfile.findOne({ subdomain });

    if (!client) {
      return res.status(404).json({
        msg: "Client not found"
      });
    }

    req.client = client;

    next();

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};