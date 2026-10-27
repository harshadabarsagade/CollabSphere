import Note from "../models/Note.js";
import Project from "../models/Project.js";
import Activity from "../models/Activity.js";

// Check whether the user can access the project
const canAccessProject = (project, userId) => {
    if (!project) return false;

    const currentUserId = userId.toString();
    const ownerId = project.owner._id
        ? project.owner._id.toString()
        : project.owner.toString();

    const isOwner = ownerId === currentUserId;

    const isMember = project.members.some((member) => {
        const memberId = member._id
            ? member._id.toString()
            : member.toString();

        return memberId === currentUserId;
    });

    return isOwner || isMember;
};

// Create a note
export const createNote = async (req, res) => {
    try {
        const { title, content, projectId } = req.body;

        if (!title?.trim() || !projectId) {
            return res.status(400).json({
                message: "Title and projectId are required"
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (!canAccessProject(project, req.user.id)) {
            return res.status(403).json({
                message: "You do not have access to this project"
            });
        }

        const note = await Note.create({
            title: title.trim(),
            content: content || "",
            project: projectId,
            owner: req.user.id
        });


        await Activity.create({
            project: projectId,
            user: req.user.id,
            action: "note_created",
            details: `Created note: ${title.trim()}`
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

// Get all notes for a project
export const getProjectNotes = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (!canAccessProject(project, req.user.id)) {
            return res.status(403).json({
                message: "You do not have access to this project"
            });
        }

        const notes = await Note.find({
            project: projectId
        }).sort({ createdAt: -1 });

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

// Update a note
export const updateNote = async (req, res) => {
    try {
        const { title, content } = req.body;

        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        const project = await Project.findById(note.project);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (!canAccessProject(project, req.user.id)) {
            return res.status(403).json({
                message: "You do not have access to this project"
            });
        }

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: "Title cannot be empty"
                });
            }

            note.title = title.trim();
        }

        if (content !== undefined) {
            note.content = content;
        }

        await note.save();

        await Activity.create({
            project: note.project,
            user: req.user.id,
            action: "note_updated",
            details: `Updated note: ${note.title}`
        });

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

// Delete a note
export const deleteNote = async (req, res) => {
    try {
        console.log("deleteNote controller called");
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        const project = await Project.findById(note.project);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (!canAccessProject(project, req.user.id)) {
            return res.status(403).json({
                message: "You do not have access to this project"
            });
        }

        await Note.findByIdAndDelete(note._id);


        const activity = await Activity.create({
            project: note.project,
            user: req.user.id,
            action: "note_deleted",
            details: `Deleted note: ${note.title}`
        });

        console.log("Saved activity:", activity._id);

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