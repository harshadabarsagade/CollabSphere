
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
    getProjectActivities,
    getProjectStats,
    createActivity
} from "../controllers/activityController.js";

const router = express.Router();

router.get("/:projectId/stats", authMiddleware, getProjectStats);
router.get("/:projectId", authMiddleware, getProjectActivities);
router.post("/", authMiddleware, createActivity);

export default router;
