import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    webinar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webinar",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: {
      type: String,
    },

    type: {
      type: String,
      enum: [
        "registration_confirmation",
        "reminder_1_day",
        "reminder_15_min",
        "webinar_link",
        "webinar_started",
        "subscription_reminder",
        "subscription_expired",
        "broadcast",
        "scheduled_custom"
      ],
      required: true,
    },

    channels: {
      type: [String],
      enum: ["email", "sms", "whatsapp"],
      default: ["email"],
    },

    phone: {
      type: String,
    },

    subject: {
      type: String,
      trim: true,
    },

    body: {
      type: String,
      required: true,
    },

    scheduledFor: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },

    sentAt: Date,

    retryCount: {
      type: Number,
      default: 0,
    },

    lastAttemptAt: Date,

    error: String,
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);