import File from "../models/File.js";
import Project from "../models/Project.js";
import path from "path";
import fs from "fs";

// Use the same uploads directory as uploadMiddleware.js
const uploadDir = path.resolve(process.cwd(), "uploads");

// Resolve and validate a stored file path
function getSafeFilePath(filePath) {
    if (!filePath || typeof filePath !== "string") {
        throw new Error("File path is missing");
    }

    // Support both absolute paths and paths relative to process.cwd()
    const resolvedPath = path.isAbsolute(filePath)
        ? path.resolve(filePath)
        : path.resolve(process.cwd(), filePath);

    const relativePath = path.relative(uploadDir, resolvedPath);

    // The file must be inside uploads/, not uploads itself
    if (
        !relativePath ||
        relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error("Invalid file path");
    }

    return resolvedPath;
}

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
                message: "Project not found or you do not have access"
            });
        }

        // Save a path relative to the backend working directory
        const storedPath = path.relative(
            process.cwd(),
            req.file.path
        );

        const file = await File.create({
            fileName: req.file.originalname,
            filePath: storedPath,
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

// Get files for a project
export const getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findOne({
            _id: projectId,
            owner: req.user.id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found or you do not have access"
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
            console.warn("Download: database record not found", {
                fileId,
                userId: req.user.id
            });

            return res.status(404).json({
                message: "File not found or you do not have access"
            });
        }

        let filePath;

        try {
            filePath = getSafeFilePath(file.filePath);
        } catch (error) {
            console.error("Download: invalid file path", {
                fileId,
                storedPath: file.filePath,
                error: error.message
            });

            return res.status(400).json({
                message: "Invalid file path"
            });
        }

        if (!fs.existsSync(filePath)) {
            console.error("Download: file missing from server", {
                fileId,
                filePath
            });

            return res.status(404).json({
                message: "File missing from server. Please upload it again."
            });
        }

        return res.download(filePath, file.fileName, (error) => {
            if (error) {
                console.error("Download stream error:", error);

                if (!res.headersSent) {
                    res.status(500).json({
                        message: "Failed to download file"
                    });
                }
            }
        });
    } catch (error) {
        console.error("Download file error:", error);

        return res.status(500).json({
            message: "Failed to download file"
        });
    }
};

// Delete file
export const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await File.findOne({
            _id: fileId,
            owner: req.user.id
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found or you do not have access"
            });
        }

        let filePath;

        try {
            filePath = getSafeFilePath(file.filePath);
        } catch (error) {
            console.error("Delete: invalid file path", {
                fileId,
                storedPath: file.filePath,
                error: error.message
            });

            return res.status(400).json({
                message: "Invalid file path"
            });
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await File.findByIdAndDelete(file._id);

        return res.status(200).json({
            message: "File deleted successfully"
        });
    } catch (error) {
        console.error("Delete file error:", error);

        return res.status(500).json({
            message: "Failed to delete file"
        });
    }
};

// Access a file in a public project
export const getPublicFile = async (req, res) => {
    try {
        const { token, fileId } = req.params;

        const project = await Project.findOne({
            shareToken: token,
            isPublic: true
        });

        if (!project) {
            return res.status(404).json({
                message: "Public project not found"
            });
        }

        const file = await File.findOne({
            _id: fileId,
            project: project._id
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found in this public project"
            });
        }

        let filePath;

        try {
            filePath = getSafeFilePath(file.filePath);
        } catch (error) {
            console.error("Public file: invalid path", {
                fileId,
                storedPath: file.filePath,
                error: error.message
            });

            return res.status(400).json({
                message: "Invalid file path"
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "File missing from server"
            });
        }

        if (req.query.download === "true") {
            return res.download(filePath, file.fileName);
        }

        return res.sendFile(filePath);
    } catch (error) {
        console.error("Public file error:", error);

        return res.status(500).json({
            message: "Failed to access public file"
        });
    }
};