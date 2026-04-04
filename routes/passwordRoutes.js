import express from "express";
import {
  forgotPassword,
  verifyOTP,
  resetPassword,
  resendOTP,
  changePassword,
} from "../controllers/passwordCon.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOTP);
router.post("/change-password", protect, changePassword);


export default router;
