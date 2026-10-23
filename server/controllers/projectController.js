
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
            File.find({
                project: project._id
            })
                .select("fileName createdAt")
                .sort({ createdAt: -1 }),

            Note.find({
                project: project._id
            })
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
