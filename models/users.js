import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            required: true,
        },
        lastname: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        occupation: {
            type: String,
            enum: ["student", "developer", "business", "freelancer", "other"],
            default: "other",
        },
        role: {
            type: String,
            enum: ["client", "admin"],
            default: "client",
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
        otp: {
            type: String,
        },
        otpExpiry: {
            type: Date,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User
