
import Note from "../models/Note.js";
import Project from "../models/Project.js";

export const createNote = async (req, res) => {
    try {
        const { title, content, projectId } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({
                message: "Title and projectId are required"
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            owner: req.user.id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const note = await Note.create({
            title,
            content,
            project: projectId,
            owner: req.user.id
        });

        return res.status(201).json({
            message: "Note created successfully",
            note
        });

    } catch (error) {
        console.error("Create note error:", error.message);

        return res.status(500).json({
            message: "Failed to create note"
        });
    }
};




export const getProjectNotes = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findOne({
            _id: projectId,
            owner: req.user.id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const notes = await Note.find({
            project: projectId,
            owner: req.user.id
        });

        return res.status(200).json({
            message: "Notes fetched successfully",
            notes
        });

    } catch (error) {
        console.error("Get notes error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch notes"
        });
    }
};




export const updateNote = async (req, res) => {
    try {
        const { title, content } = req.body;

        const note = await Note.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user.id
            },
            {
                title,
                content
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        return res.status(200).json({
            message: "Note updated successfully",
            note
        });

    } catch (error) {
        console.error("Update note error:", error.message);

        return res.status(500).json({
            message: "Failed to update note"
        });
    }
};



export const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        return res.status(200).json({
            message: "Note deleted successfully"
        });

    } catch (error) {
        console.error("Delete note error:", error.message);

        return res.status(500).json({
            message: "Failed to delete note"
        });
    }
};
