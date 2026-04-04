import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
{
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientProfile",
    required: true
  },

  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
    default:null
  },

  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "INR"
  },

  paymentMethod: {
    type: String,
    enum: ["razorpay", "stripe", "manual"],
    default: "razorpay"
  },

  paymentId: {
    type: String
  },

  status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },

  paidAt: {
    type: Date,
    default: Date.now
  }

},
{ timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);