import express from "express";
import {
  handleUserSignup,
  handleUserLogin,
  handleLogout
} from "../controllers/userCon.js";

const router = express.Router();

router.post("/registers", handleUserSignup);
router.post("/login", handleUserLogin);
router.post("/logout", handleLogout);

export default router;