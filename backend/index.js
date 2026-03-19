import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoute.js";

const app = express();
dotenv.config();
connectDB();

const PORT = process.env.PORT | 5000;

app.get("/", (req, res) => {
  res.send("Anasayfa");
});

app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
