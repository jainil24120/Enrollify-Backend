import User from "../models/users.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/emailService.js";

/*OTP Generator*/
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/*Forgot Password */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = hashedOTP;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendEmail({
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP is ${otp}. It expires in 10 minutes.`,
            html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset OTP</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:5px;">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `,
        });


        res.status(200).json({
            message: "OTP sent to email",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
/*Resend OTP*/
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otpExpiry && user.otpExpiry > new Date()) {
            const remainingTime = Math.ceil(
                (user.otpExpiry - new Date()) / 1000 / 60
            );

            return res.status(400).json({
                message: `OTP already sent. Try again in ${remainingTime} min`,
            });
        }

        /* Generate New OTP */
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = hashedOTP;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendEmail({
            to: email,
            subject: "Resend Password Reset OTP",
            text: `Your new OTP is ${otp}. It expires in 10 minutes.`,
            html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Resend OTP</h2>
          <p>Your new OTP is:</p>
          <h1 style="letter-spacing:5px;">${otp}</h1>
          <p>This OTP expires in 10 minutes.</p>
        </div>
      `,
        });

        res.status(200).json({
            message: "New OTP sent successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/*OTP*/
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res
                .status(400)
                .json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });

        if (!user || !user.otp) {
            return res.status(400).json({ message: "Invalid OTP request" });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        const isMatch = await bcrypt.compare(otp.trim(), user.otp);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        res.status(200).json({
            message: "OTP verified successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/*Change Password (Authenticated) */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // ✅ validation
        if (!email || !otp || !newPassword){
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        // ✅ match check
        // if (newPassword !== confirmPassword) {
        //     return res.status(400).json({
        //         message: "Passwords do not match",
        //     });
        // }

        const user = await User.findOne({ email });

        if (!user || !user.otp) {
            return res.status(400).json({ message: "Invalid request" });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        const isMatch = await bcrypt.compare(otp.trim(), user.otp);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;

        await user.save();

        // ✅ email after success (yaha hona chahiye)
        await sendEmail({
            to: email,
            subject: "Password Reset Successful",
            html: `
              <h2>Password Updated</h2>
              <p>Your password has been changed successfully.</p>
            `,
        });

        res.status(200).json({
            message: "Password reset successful",
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};