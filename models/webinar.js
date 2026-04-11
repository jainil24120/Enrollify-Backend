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

    slug: {
      type: String,
      unique: true,
      lowercase: true,
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
      min: 0,
    },

    originalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPaid: {
      type: Boolean,
      default: function () {
        return this.price > 0;
      },
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

    registrationDeadline: {
      type: Date,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clients: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientProfile",
      required: true,
    },

    language: {
      type: String,
      default: "English",
    },

    maxSeats: {
      type: Number,
      min: 1,
      default: null,
    },

    bannerImage: {
      type: String,
    },

    meetingLink: {
      type: String,
    },

    // Speaker Details
    speakerName: {
      type: String,
      trim: true,
    },

    speakerBio: {
      type: String,
    },

    speakerImage: {
      type: String,
    },

    speakerSocials: {
      instagram: { type: String },
      youtube: { type: String },
      linkedin: { type: String },
      twitter: { type: String },
      website: { type: String },
    },

    // Custom Learning Outcomes
    learningOutcomes: {
      type: [String],
      default: [],
    },

    // Target Audience
    targetAudience: {
      type: [String],
      default: [],
    },

    // FAQ
    faqs: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],

    // Agenda / Schedule
    agenda: [
      {
        time: { type: String },
        topic: { type: String },
      },
    ],

    // Testimonials
    testimonials: [
      {
        name: { type: String },
        role: { type: String },
        text: { type: String },
        image: { type: String },
      },
    ],

    // Custom CTA
    ctaText: {
      type: String,
      default: "",
    },

    // Bonus / Extras
    bonusText: {
      type: String,
      default: "",
    },

    // Trust logos (company names)
    trustLogos: {
      type: [String],
      default: [],
    },

    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      default: null,
    },

    paymentId: {
      type: String,
    },

    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "live", "completed"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

// Auto-generate slug from title before saving
webinarSchema.pre("save", async function () {
  if (!this.slug || this.isModified("title")) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check uniqueness
    let slug = baseSlug;
    let count = 1;
    while (await mongoose.models.Webinar.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    this.slug = slug;
  }
});

const Webinar = mongoose.model("Webinar", webinarSchema);

export default Webinar;
