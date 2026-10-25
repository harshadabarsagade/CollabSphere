
import express from "express";

import {
    uploadFile,
    getProjectFiles,
    downloadFile,
    deleteFile,
    getPublicFile
} from "../controllers/fileController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/public/:token/:fileId", getPublicFile);

router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    uploadFile
);

router.get(
    "/project/:projectId",
    authMiddleware,
    getProjectFiles
);

router.get(
    "/download/:fileId",
    authMiddleware,
    downloadFile
);

router.delete(
    "/:fileId",
    authMiddleware,
    deleteFile
);

export default router;
