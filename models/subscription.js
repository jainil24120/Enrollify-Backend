import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String, // Basic / Growth / Elite
      required: true,
    },

    price: {
      type: Number, // 699 / 1499 / 1999
      required: true,
    },

    duration: {
      type: String,
      default: "monthly",
    },

    features: {
      // Webinar
      webinarsLimit: {
        type: Number, // 1 / 5 / null (unlimited)
        default: null,
      },

      // Domain
      customDomain: {
        type: Boolean,
        default: false,
      },

      subdomain: {
        type: Boolean,
        default: true,
      },

      // Page Builder
      landingPageBuilder: {
        type: String, // basic / advanced
        enum: ["basic", "advanced"],
        default: "basic",
      },

      // Automation
      emailAutomation: {
        type: Boolean,
        default: false,
      },

      whatsappAutomation: {
        type: Boolean,
        default: false,
      },

      // Payment
      paymentGateways: {
        razorpay: { type: Boolean, default: true },
        stripe: { type: Boolean, default: false },
      },

      // Analytics
      analytics: {
        type: Boolean,
        default: false,
      },

      advancedAnalytics: {
        type: Boolean,
        default: false,
      },

      // Tracking
      metaPixel: {
        type: Boolean,
        default: false,
      },

      conversionTracking: {
        type: Boolean,
        default: false,
      },

      // Extra
      affiliateSystem: {
        type: Boolean,
        default: false,
      },

      apiAccess: {
        type: Boolean,
        default: false,
      },

      // Support
      support: {
        type: String,
        enum: ["standard", "priority", "dedicated"],
        default: "standard",
      },

      // Fees
      transactionFee: {
        type: Number, // 8 / 5 / 2 (%)
        default: 0,
      },
    },

    limits: {
      webinarsPerMonth: {
        type: Number,
        default: null, // null = unlimited
      },
      maxDurationMinutes: {
        type: Number,
        default: null, // null = unlimited
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);