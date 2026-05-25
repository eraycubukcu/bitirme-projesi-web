import express from "express";
import rateLimit from "express-rate-limit";
import {
  adminLogin,
  getDashboard,
  getAssignedStudents,
  getTeachersAdmin,
  triggerCascade,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, adminLogin);
router.get("/dashboard", protect, getDashboard);
router.get("/teachers", protect, getTeachersAdmin);
router.get("/assigned", protect, getAssignedStudents);
const cascadeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: "Çok sık tetikleme. Lütfen biraz bekleyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/cascade", protect, cascadeLimiter, triggerCascade);

export default router;
