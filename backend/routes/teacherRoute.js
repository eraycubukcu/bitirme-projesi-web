import express from "express";
import rateLimit from "express-rate-limit";
import {
  teacherLogin,
  getMyStudents,
  finalizeApproval,
  updateMyProfile,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachers,
} from "../controllers/teacherController.js";
import { protect, protectTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Hoca girişi (public)
router.post("/login", loginLimiter, teacherLogin);

// Hoca paneli (teacher auth)
router.get("/my-students", protectTeacher, getMyStudents);
router.post("/finalize", protectTeacher, finalizeApproval);
router.put("/profile", protectTeacher, updateMyProfile);

// Admin CRUD (admin auth) — parameterized route en sona
router.get("/", getTeachers);
router.post("/", protect, createTeacher);
router.put("/:id", protect, updateTeacher);
router.delete("/:id", protect, deleteTeacher);

export default router;
