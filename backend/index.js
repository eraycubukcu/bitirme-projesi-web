import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoute.js";
import teacherRoutes from "./routes/teacherRoute.js";
import formRoutes from "./routes/formRoute.js";
import studentRoutes from "./routes/studentRoute.js";
import cors from "cors";

const app = express();
dotenv.config();
connectDB();

const PORT = process.env.PORT | 5000;

app.use(express.json());
app.use(cors());
app.use("/api/admin", adminRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/form", formRoutes);
app.use("/api/students", studentRoutes);

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
