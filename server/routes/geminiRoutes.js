
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { generateAIResponse } from "../controllers/geminiController.js";

const router = express.Router();

router.post("/", authMiddleware, generateAIResponse);

export default router;
