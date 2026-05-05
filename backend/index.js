import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoute.js";
import teacherRoutes from "./routes/teacherRoute.js";
import formRoutes from "./routes/formRoute.js";
import studentRoutes from "./routes/studentRoute.js";

dotenv.config();

// JWT_SECRET zorunlu — eksikse başlatma
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("HATA: JWT_SECRET tanımlı değil veya çok kısa (min 16 karakter).");
  process.exit(1);
}

connectDB();

const app = express();

// ── Güvenlik başlıkları ────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
// Üretimde CORS_ORIGIN ortam değişkeni ile kısıtlayın.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Sunucu-sunucu isteklerinde origin yok (undefined) — izin ver
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS politikası bu kaynağa izin vermiyor."));
      }
    },
    credentials: true,
  })
);

// ── Body limiti (büyük payload saldırılarına karşı) ────────────────────────
app.use(express.json({ limit: "10kb" }));

// ── Rotalar ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.use("/api/admin", adminRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/form", formRoutes);
app.use("/api/students", studentRoutes);

// ── Global hata yakalayıcı ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message?.includes("CORS")) {
    return res.status(403).json({ message: "Bu kaynaktan erişim engellendi." });
  }
  console.error(err);
  res.status(500).json({ message: "Sunucu hatası." });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
