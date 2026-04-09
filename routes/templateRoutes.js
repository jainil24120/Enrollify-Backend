import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { createTemplate, getAllTemplates, getTemplatesByTier, updateTemplate, deleteTemplate } from "../controllers/templateCon.js";

const router = express.Router();

router.get("/", getAllTemplates);
router.get("/my-tier", protect, getTemplatesByTier);
router.post("/", protect, isAdmin, createTemplate);
router.put("/:id", protect, isAdmin, updateTemplate);
router.delete("/:id", protect, isAdmin, deleteTemplate);

export default router;
