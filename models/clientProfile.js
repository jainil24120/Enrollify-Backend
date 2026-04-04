import mongoose from "mongoose";

const clientProfileSchema = new mongoose.Schema(
    {
        subdomain: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        first_name: {
            type: String,
            required: true,
            trim: true,
        },
        last_name: {
            type: String,
            required: true,
            trim: true,
        },
        Organization_Name: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
            required: true,
        },

        bankDetails: {
            accountHolderName: String,
            accountNumber: String,
            ifscCode: String,
            bankName: String,
        },

        upiId: {
            type: String,
            trim: true,
        },

        gstNumber: {
            type: String,
            trim: true,
        },
        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
            default: null,
        },
        subscriptionValidTill: {
            type: Date,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);
clientProfileSchema.pre("validate", function (next) {
    const hasBank =
        this.bankDetails &&
        Object.values(this.bankDetails).some((v) => v);

    const hasUpi = !!this.upiId;

    if (!hasBank && !hasUpi) {
        return next(
            new Error("Either bank details or UPI ID is required")
        );
    }

    next();
});

const ClientProfile = mongoose.model(
    "ClientProfile",
    clientProfileSchema
);

export default ClientProfile;
