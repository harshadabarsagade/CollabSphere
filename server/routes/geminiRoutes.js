import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
    generateAIResponse,
    explainContent,
    generateDocs,
    generateReadme
} from "../controllers/geminiController.js";

const router = express.Router();

router.post("/", authMiddleware, generateAIResponse);

router.post("/explain", authMiddleware, explainContent);
router.post("/docs", authMiddleware, generateDocs);
router.post("/readme", authMiddleware, generateReadme);

export default router;