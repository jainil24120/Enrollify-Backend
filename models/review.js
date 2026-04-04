import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        webinar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Webinar",
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);
reviewSchema.index({ webinar: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;