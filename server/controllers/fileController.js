
import File from "../models/File.js";
import Project from "../models/Project.js";
import path from "path";
import fs from "fs";

// Upload file
export const uploadFile = async (req, res) => {
    try {
        const { projectId } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "Please select a file"
            });
        }

        if (!projectId) {
            return res.status(400).json({
                message: "Project ID is required"
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

        const file = await File.create({
            fileName: req.file.originalname,
            filePath: req.file.path,
            project: project._id,
            owner: req.user.id
        });

        return res.status(201).json({
            message: "File uploaded successfully",
            file
        });

    } catch (error) {
        console.error("Upload file error:", error);

        return res.status(500).json({
            message: "Failed to upload file",
            error: error.message
        });
    }
};

// Get project files
export const getProjectFiles = async (req, res) => {
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

        const files = await File.find({
            project: projectId,
            owner: req.user.id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            count: files.length,
            files
        });

    } catch (error) {
        console.error("Get project files error:", error);

        return res.status(500).json({
            message: "Failed to fetch files",
            error: error.message
        });
    }
};

// Download file
export const downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await File.findOne({
            _id: fileId,
            owner: req.user.id
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        const uploadDir = path.resolve("uploads");
        const filePath = path.resolve(file.filePath);

        if (!filePath.startsWith(uploadDir + path.sep)) {
            return res.status(400).json({
                message: "Invalid file path"
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "File missing from server"
            });
        }

        return res.download(filePath, file.fileName);

    } catch (error) {
        console.error("Download file error:", error);

        return res.status(500).json({
            message: "Failed to download file"
        });
    }
};
