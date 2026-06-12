import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import internshipRoutes from "./routes/internshipRoutes.js";
import recordBookRoutes from "./routes/recordBookRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import { seedDefaultSkills } from "./controllers/skillController.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", module: "student-internship-recordbook" });
});

app.use("/api/internship", internshipRoutes);
app.use("/api/recordbook", recordBookRoutes);
app.use("/api/skills", skillRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || "Server error"
  });
});

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultSkills();

    const server = app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Stop that process or set PORT to another value.`);
        process.exit(1);
      }

      throw error;
    });
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
};

startServer();
