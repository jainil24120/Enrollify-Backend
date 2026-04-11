import mongoose from "mongoose";

const whatsappSessionSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientProfile",
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["disconnected", "qr_pending", "connected"],
      default: "disconnected",
    },
    lastConnected: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("WhatsappSession", whatsappSessionSchema);
