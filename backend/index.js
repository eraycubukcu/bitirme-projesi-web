import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoute.js";
import teacherRoutes from "./routes/teacherRoute.js";

const app = express();
dotenv.config();
connectDB();

const PORT = process.env.PORT | 5000;

app.get("/", (req, res) => {
  res.send("Anasayfa");
});

app.use("/api/admin", adminRoutes);
app.use("/api/teachers", teacherRoutes);

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
