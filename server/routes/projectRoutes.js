
import express from "express";

import {
    createProject,
    getMyProjects,
    updateProject,
    deleteProject,
    addProjectMember,
    enableProjectSharing,
    getPublicProject,
    disableProjectSharing
} from "../controllers/projectController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Existing project CRUD
router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getMyProjects);
router.put("/:id", authMiddleware, updateProject);
router.delete("/:id", authMiddleware, deleteProject);


router.post("/:id/members", authMiddleware, addProjectMember);


router.post("/:id/share", authMiddleware, enableProjectSharing);
router.delete("/:id/share", authMiddleware, disableProjectSharing);


router.get("/public/:token", getPublicProject);

export default router;
