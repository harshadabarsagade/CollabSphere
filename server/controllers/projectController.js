
import Project from "../models/Project.js";

export const createProject = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Project title is required"
            });
        }

        const project = await Project.create({
            title,
            description,
            owner: req.user.id
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



export const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            owner: req.user.id
        });

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



export const updateProject = async (req, res) => {
    try {
        const { title, description } = req.body;

        const project = await Project.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user.id
            },
            {
                title,
                description
            },
            {
                new: true,
                runValidators: true
            }
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
