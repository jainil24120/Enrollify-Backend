import mongoose from "mongoose";

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  key: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: "" },
  thumbnail: { type: String, default: "" },
  minTier: { type: String, enum: ["basic", "growth", "elite"], default: "basic" },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  customizable: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const Template = mongoose.model("Template", templateSchema);
export default Template;
