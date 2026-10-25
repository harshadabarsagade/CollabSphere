import File from "../models/File.js";
import Project from "../models/Project.js";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve(process.cwd(), "uploads");

// Check project access for owner and members
const canAccessProject = (project, userId) => {
    if (!project) return false;

    const currentUserId = userId.toString();
    const ownerId = project.owner._id
        ? project.owner._id.toString()
        : project.owner.toString();

    const isOwner = ownerId === currentUserId;

    const isMember = (project.members || []).some((member) => {
        const memberId = member._id
            ? member._id.toString()
            : member.toString();

        return memberId === currentUserId;
    });

    return isOwner || isMember;
};

// Safely resolve a stored file path
function getSafeFilePath(filePath) {
    if (!filePath || typeof filePath !== "string") {
        throw new Error("File path is missing");
    }

    const resolvedPath = path.isAbsolute(filePath)
        ? path.resolve(filePath)
        : path.resolve(process.cwd(), filePath);

    const relativePath = path.relative(uploadDir, resolvedPath);

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
    let uploadedPath;

    try {
        const { projectId } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "Please select a file"
            });
        }

        uploadedPath = req.file.path;

        if (!projectId) {
            fs.existsSync(uploadedPath) && fs.unlinkSync(uploadedPath);

            return res.status(400).json({
                message: "Project ID is required"
            });
        }

        const project = await Project.findById(projectId);

        if (!project || !canAccessProject(project, req.user.id)) {
            fs.existsSync(uploadedPath) && fs.unlinkSync(uploadedPath);

            return res.status(403).json({
                message: "Project not found or you do not have access"
            });
        }

        const storedPath = path.relative(process.cwd(), uploadedPath);

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
        if (uploadedPath && fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
        }

        console.error("Upload file error:", error.message);

        return res.status(500).json({
            message: "Failed to upload file"
        });
    }
};

// Get project files
export const getProjectFiles = async (req, res) => {
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

        const files = await File.find({
            project: projectId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            count: files.length,
            files
        });
    } catch (error) {
        console.error("Get project files error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch files"
        });
    }
};




// Read file content for AI explanation
export const readFileContent = async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        const project = await Project.findById(file.project);

        if (!project || !canAccessProject(project, req.user.id)) {
            return res.status(403).json({
                message: "You do not have access to this file"
            });
        }

        const filePath = getSafeFilePath(file.filePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "File missing from server. Please upload it again."
            });
        }

        const allowedExtensions = [
            ".js", ".jsx", ".ts", ".tsx", ".py",
            ".html", ".css", ".json", ".md", ".txt"
        ];

        if (!allowedExtensions.includes(path.extname(file.fileName).toLowerCase())) {
            return res.status(400).json({
                message: "AI explanation is available only for text and code files."
            });
        }

        const content = fs.readFileSync(filePath, "utf8");

        if (content.length > 20000) {
            return res.status(400).json({
                message: "File is too large to explain. Maximum size is 20,000 characters."
            });
        }

        return res.status(200).json({
            fileName: file.fileName,
            content
        });
    } catch (error) {
        console.error("Read file content error:", error.message);

        return res.status(500).json({
            message: "Could not read file content"
        });
    }
};




// Download file
export const downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        const project = await Project.findById(file.project);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (!canAccessProject(project, req.user.id)) {
            return res.status(403).json({
                message: "You do not have access to this file"
            });
        }

        let filePath;

        try {
            filePath = getSafeFilePath(file.filePath);
        } catch {
            return res.status(400).json({
                message: "Invalid file path"
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "File missing from server. Please upload it again."
            });
        }

        return res.download(filePath, file.fileName, (error) => {
            if (error) {
                console.error("Download stream error:", error.message);

                if (!res.headersSent) {
                    res.status(500).json({
                        message: "Failed to download file"
                    });
                }
            }
        });
    } catch (error) {
        console.error("Download file error:", error.message);

        return res.status(500).json({
            message: "Failed to download file"
        });
    }
};

// Delete file
export const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        const project = await Project.findById(file.project);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (!canAccessProject(project, req.user.id)) {
            return res.status(403).json({
                message: "You do not have access to this file"
            });
        }

        let filePath;

        try {
            filePath = getSafeFilePath(file.filePath);
        } catch {
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
        console.error("Delete file error:", error.message);

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
        } catch {
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
        console.error("Public file error:", error.message);

        return res.status(500).json({
            message: "Failed to access public file"
        });
    }
};
