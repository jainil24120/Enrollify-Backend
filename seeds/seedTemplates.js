import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Template from "../models/template.js";
import Subscription from "../models/subscription.js";

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("MONGO_URL not found in environment variables");
  process.exit(1);
}

const templates = [
  {
    name: "Classic",
    key: "classic",
    minTier: "basic",
    isDefault: true,
    sortOrder: 1,
    description: "Clean, professional layout with hero section and speaker showcase",
  },
  {
    name: "Modern Dark",
    key: "modern",
    minTier: "growth",
    sortOrder: 2,
    description: "Dark theme with split-screen hero and card-based sections",
  },
  {
    name: "Bold",
    key: "bold",
    minTier: "elite",
    sortOrder: 3,
    description: "Full-width hero with gradient overlay and animated sections",
    customizable: true,
  },
];

const PLAN_TIER_MAP = {
  Basic: "basic",
  Growth: "growth",
  Elite: "elite",
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    // Seed templates (idempotent — skip if key already exists)
    for (const tpl of templates) {
      const existing = await Template.findOne({ key: tpl.key });
      if (existing) {
        console.log(`Template "${tpl.key}" already exists, skipping`);
      } else {
        await Template.create(tpl);
        console.log(`Template "${tpl.key}" created`);
      }
    }

    // Update subscription documents with templateTier based on plan name
    const subscriptions = await Subscription.find({});
    for (const sub of subscriptions) {
      const tier = PLAN_TIER_MAP[sub.name];
      if (tier && sub.features?.templateTier !== tier) {
        await Subscription.findByIdAndUpdate(sub._id, {
          "features.templateTier": tier,
        });
        console.log(`Subscription "${sub.name}" → templateTier set to "${tier}"`);
      } else if (tier) {
        console.log(`Subscription "${sub.name}" already has templateTier "${tier}", skipping`);
      } else {
        console.log(`Subscription "${sub.name}" has no tier mapping, skipping`);
      }
    }

    console.log("Seed complete");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
}

seed();
