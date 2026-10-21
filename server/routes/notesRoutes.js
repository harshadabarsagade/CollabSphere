
import express from "express";
import { 
    createNote,
    getProjectNotes,
    updateNote,
    deleteNote

} from "../controllers/notesController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createNote);
router.get("/project/:projectId", authMiddleware, getProjectNotes);
router.put("/:id", authMiddleware, updateNote);
router.delete("/:id", authMiddleware, deleteNote);


export default router;
