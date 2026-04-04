import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Not required as guests register without an account
    },
    firstname: { type: String, required: true },
    lastname: { type: String },
    email: { type: String, required: true },
    city: { type: String },
    phone: { type: String, required: true },
    paymentMethod: { type: String, enum: ["upi", "card"] },
    upiId: { type: String },
    cardNumber: { type: String },

    webinar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webinar",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "free", "paid"],
      default: "pending",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String
  },
  { timestamps: true }
);

registrationSchema.index({ email: 1, webinar: 1 }, { unique: true });

export default mongoose.model("Registration", registrationSchema);
