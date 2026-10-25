
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import Project from "../models/Project.js";
import User from "../models/User.js";
import File from "../models/File.js";
import Note from "../models/Note.js";


export const createProject = async (req, res) => {
    try {
        const { title, description = "" } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({
                message: "Project title is required"
            });
        }

        const project = await Project.create({
            title: title.trim(),
            description,
            owner: req.user.id,
            members: []
        });

        return res.status(201).json({
            message: "Project created successfully",
            project
        });
    } catch (error) {
        console.error("Create project error:", error.message);
        return res.status(500).json({
            message: "Failed to create project"
        });
    }
};

// Get projects owned by the user or shared with them
export const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        }).sort({ updatedAt: -1 });

        return res.status(200).json({
            message: "Projects fetched successfully",
            projects
        });
    } catch (error) {
        console.error("Get projects error:", error.message);
        return res.status(500).json({
            message: "Failed to fetch projects"
        });
    }
};

// Update a project (owner only)
export const updateProject = async (req, res) => {
    try {
        const { title, description } = req.body;

        const updates = {};
        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: "Project title cannot be empty"
                });
            }
            updates.title = title.trim();
        }
        if (description !== undefined) {
            updates.description = description;
        }

        const project = await Project.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user.id
            },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        return res.status(200).json({
            message: "Project updated successfully",
            project
        });
    } catch (error) {
        console.error("Update project error:", error.message);
        return res.status(500).json({
            message: "Failed to update project"
        });
    }
};

// Delete a project (owner only)
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Remove associated records so orphaned data is not left behind.
        await Promise.all([
            File.deleteMany({ project: project._id }),
            Note.deleteMany({ project: project._id })
        ]);

        return res.status(200).json({
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error("Delete project error:", error.message);
        return res.status(500).json({
            message: "Failed to delete project"
        });
    }
};

// Add a registered user as a project member (owner only)
export const addProjectMember = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({
                message: "Member email is required"
            });
        }

        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found or you are not the owner"
            });
        }

        const member = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!member) {
            return res.status(404).json({
                message: "User with this email was not found"
            });
        }

        if (member._id.equals(project.owner)) {
            return res.status(400).json({
                message: "The owner is already part of the project"
            });
        }

        if (project.members.some(id => id.equals(member._id))) {
            return res.status(409).json({
                message: "User is already a project member"
            });
        }

        project.members.push(member._id);
        await project.save();

        return res.status(200).json({
            message: "Collaborator added successfully",
            project
        });
    } catch (error) {
        console.error("Add member error:", error.message);
        return res.status(500).json({
            message: "Failed to add collaborator"
        });
    }
};

// Enable public read-only sharing (owner only)
export const enableProjectSharing = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (!project.shareToken) {
            project.shareToken = randomBytes(32).toString("hex");
        }

        project.isPublic = true;
        await project.save();

        return res.status(200).json({
            message: "Public sharing enabled",
            shareToken: project.shareToken
        });
    } catch (error) {
        console.error("Enable sharing error:", error.message);
        return res.status(500).json({
            message: "Failed to enable public sharing"
        });
    }
};


export const getPublicProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            shareToken: req.params.token,
            isPublic: true
        }).select("title description createdAt updatedAt");

        if (!project) {
            return res.status(404).json({
                message: "Public project not found"
            });
        }

        const [files, notes] = await Promise.all([
            File.find({ project: project._id })
                .select("fileName createdAt")
                .sort({ createdAt: -1 }),

            Note.find({ project: project._id })
                .select("title content createdAt updatedAt")
                .sort({ createdAt: -1 })
        ]);

        return res.status(200).json({
            message: "Public project fetched successfully",
            project,
            files,
            notes
        });
    } catch (error) {
        console.error("Public project error:", error.message);
        return res.status(500).json({
            message: "Failed to fetch public project"
        });
    }
};

// Disable public sharing (owner only)
export const disableProjectSharing = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        project.isPublic = false;
        project.shareToken = null;
        await project.save();

        return res.status(200).json({
            message: "Public sharing disabled"
        });
    } catch (error) {
        console.error("Disable sharing error:", error.message);
        return res.status(500).json({
            message: "Failed to disable public sharing"
        });
    }
};
