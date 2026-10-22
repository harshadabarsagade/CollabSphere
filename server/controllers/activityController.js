
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Project from "../models/Project.js";
import Note from "../models/Note.js";
import File from "../models/File.js";

export const getProjectActivities = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID"
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found or access denied"
            });
        }

        const activities = await Activity.find({
            project: projectId
        })
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(50);

        return res.status(200).json({
            message: "Activities fetched successfully",
            activities
        });
    } catch (error) {
        console.error("Get activities error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch activities"
        });
    }
};

export const getProjectStats = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID"
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found or access denied"
            });
        }

        const [notesCount, filesCount, activitiesCount] =
            await Promise.all([
                Note.countDocuments({ project: projectId }),
                File.countDocuments({ project: projectId }),
                Activity.countDocuments({ project: projectId })
            ]);

        return res.status(200).json({
            message: "Project statistics fetched successfully",
            stats: {
                notesCount,
                filesCount,
                activitiesCount,
                membersCount: project.members.length,
                isPublic: project.isPublic
            }
        });
    } catch (error) {
        console.error("Project stats error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch project statistics"
        });
    }
};

// Record an activity when a project member performs an action
export const createActivity = async (req, res) => {
    try {
        const { projectId, action, details = "" } = req.body;

        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                message: "Valid project ID is required"
            });
        }

        if (!action?.trim()) {
            return res.status(400).json({
                message: "Activity action is required"
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found or access denied"
            });
        }

        const allowedActions = [
            "project_created",
            "project_updated",
            "note_created",
            "note_updated",
            "note_deleted",
            "file_uploaded",
            "file_deleted"
        ];

        if (!allowedActions.includes(action)) {
            return res.status(400).json({
                message: "Unsupported activity action"
            });
        }

        const activity = await Activity.create({
            project: projectId,
            user: req.user.id,
            action,
            details: String(details).slice(0, 500)
        });

        return res.status(201).json({
            message: "Activity recorded successfully",
            activity
        });
    } catch (error) {
        console.error("Create activity error:", error.message);

        return res.status(500).json({
            message: "Failed to record activity"
        });
    }
};
