import mongoose from "mongoose";

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
  },
  { timestamps: true }
);

// Helper to get a setting
platformSettingsSchema.statics.getSetting = async function (key, defaultValue = "") {
  const doc = await this.findOne({ key });
  return doc ? doc.value : defaultValue;
};

// Helper to set a setting
platformSettingsSchema.statics.setSetting = async function (key, value) {
  return this.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
};

export default mongoose.model("PlatformSettings", platformSettingsSchema);
