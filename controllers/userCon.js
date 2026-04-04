import User from "../models/users.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
// USER SIGNUP
export const handleUserSignup = async (req, res) => {
  try {
    console.log("HANDLE USER SIGNUP - BODY:", req.body);
    const {
      firstname,
      lastname,
      phone,
      email,
      password,
      role,
      occupation,
      gender,
    } = req.body;

    // Basic validation
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const normalizedEmail = email.toLowerCase();

    //  Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists, please login",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //  Create user
    const user = await User.create({
      firstname,
      lastname,
      phone,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      occupation,
      gender,
    });

    console.log("USER CREATED:", user._id, user.email);

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        gender: user.gender,
      },
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
// USER LOGIN

export const handleUserLogin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        message: "Email or phone is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    //Find user
    const query = email
      ? { email: email.toLowerCase() }
      : { phone };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: "User not found, please signup",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// USER LOGOUT
export const handleLogout = async (req, res) => {
  try {
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
