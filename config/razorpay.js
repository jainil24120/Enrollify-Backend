import dotenv from "dotenv";
dotenv.config(); // ✅ FIX
import Razorpay from "razorpay";

let razorpay = null; // ✅ MUST

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.log("⚠ Razorpay disabled");
}

export default razorpay;
