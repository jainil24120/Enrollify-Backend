import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { enrollWebinar } from "../controllers/enrollWebinar.js";
import { verifyPayment } from "../controllers/enrollVerifypaymentCon.js";

const router = express.Router();

router.post("/enroll", enrollWebinar);
router.post("/verify", verifyPayment);

export default router;