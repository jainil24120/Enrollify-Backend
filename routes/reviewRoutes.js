import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getReviews, createReview } from "../controllers/reviewCon.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/", protect, getReviews);

export default router;