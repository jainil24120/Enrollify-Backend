import Template from "../models/template.js";
import ClientProfile from "../models/clientProfile.js";
import Subscription from "../models/subscription.js";
import Webinar from "../models/webinar.js";

const TIER_HIERARCHY = { basic: 1, growth: 2, elite: 3 };

export const createTemplate = async (req, res) => {
  try {
    const { name, key, description, thumbnail, minTier, isDefault, customizable, sortOrder } = req.body;

    if (!name || !key) {
      return res.status(400).json({ msg: "Name and key are required" });
    }

    const existing = await Template.findOne({ key: key.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ msg: "Template with this key already exists" });
    }

    const template = await Template.create({
      name,
      key,
      description,
      thumbnail,
      minTier,
      isDefault,
      customizable,
      sortOrder,
    });

    res.status(201).json({ msg: "Template created successfully", template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTemplatesByTier = async (req, res) => {
  try {
    const clientProfile = await ClientProfile.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!clientProfile) {
      return res.status(404).json({ msg: "Client profile not found" });
    }

    if (!clientProfile.subscription) {
      return res.status(403).json({ msg: "No active subscription found" });
    }

    const subscription = await Subscription.findById(clientProfile.subscription);

    if (!subscription || subscription.status !== "active") {
      return res.status(403).json({ msg: "Subscription is not active" });
    }

    const clientTier = subscription.features?.templateTier || "basic";
    const clientTierLevel = TIER_HIERARCHY[clientTier] || 1;

    const templates = await Template.find({ isActive: true }).sort({ sortOrder: 1 });

    const accessibleTemplates = templates.filter(
      (t) => (TIER_HIERARCHY[t.minTier] || 1) <= clientTierLevel
    );

    res.json({
      tier: clientTier,
      templates: accessibleTemplates,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!template) {
      return res.status(404).json({ msg: "Template not found" });
    }

    res.json({ msg: "Template updated successfully", template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const webinarCount = await Webinar.countDocuments({ template: id });
    if (webinarCount > 0) {
      return res.status(400).json({
        msg: `Cannot delete template: ${webinarCount} webinar(s) are using it. Remove the template from those webinars first.`,
      });
    }

    const template = await Template.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ msg: "Template not found" });
    }

    res.json({ msg: "Template deleted (soft) successfully", template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
