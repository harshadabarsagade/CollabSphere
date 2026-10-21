
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js'
import projectRoutes from "./routes/projectRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT

app.use(express.json())
app.use(cors())
app.use('/api/auth', authRoutes)
app.use("/api/projects", projectRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/files", fileRoutes);


app.get("/", (req, res) => {
    res.send("Collabsphere API is running !")
});


const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup error:", error);
    }
};

startServer();




