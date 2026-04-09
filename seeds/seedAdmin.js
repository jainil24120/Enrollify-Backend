import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/users.js";

const MONGO_URL = process.env.MONGO_URL;

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    const email = "jainiljain.dev@gmail.com";
    const existing = await User.findOne({ email });

    if (existing) {
      // Update to admin if not already
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log(`Updated ${email} role to admin`);
      } else {
        console.log(`${email} is already an admin`);
      }
    } else {
      const hashedPassword = await bcrypt.hash("J@inilJ@in.enrollify", 10);
      await User.create({
        firstname: "Jainil",
        lastname: "Jain",
        phone: "0000000000",
        email,
        password: hashedPassword,
        role: "admin",
        gender: "male",
      });
      console.log(`Admin created: ${email}`);
    }

    await mongoose.disconnect();
    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

seedAdmin();
