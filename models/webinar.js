import mongoose from "mongoose";

const webinarSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    categories: {
      type: [String],
      enum: [
        "Marketing",
        "Business",
        "Technology",
        "Finance",
        "Startup",
        "Design",
        "Health",
        "Education",
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one category is required",
      },
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },

    isPaid: {
      type: Boolean,
      default: function () {
        return this.price > 0;
      }
    },
    webinarDateTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clients: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientProfile",
      required: true
    },

    language: {
      type: String,
      default: "English",
    },

    maxSeats: {
      type: Number,
      min: 1,
      default: null
    },

    bannerImage: {  
      type: String,
    },

    meetingLink: {
      type: String,
    },

    paymentId: {
      type: String,
    },

    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "live", "completed"],
      default: "scheduled"
    },
  },
  { timestamps: true }
);

const Webinar = mongoose.model("Webinar", webinarSchema);

export default Webinar;
