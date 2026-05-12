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
router.post("/cascade", protect, triggerCascade);

export default router;
