
import express from "express";

import {
    uploadFile,
    getProjectFiles,
    downloadFile
} from "../controllers/fileController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Upload a file
router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    uploadFile
);

// Get files for a project
router.get(
    "/project/:projectId",
    authMiddleware,
    getProjectFiles
);

// Download a file
router.get(
    "/download/:fileId",
    authMiddleware,
    downloadFile
);

export default router;
