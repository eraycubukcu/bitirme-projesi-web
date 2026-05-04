import express from "express";
import {
  teacherLogin,
  getMyStudents,
  finalizeApproval,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachers,
} from "../controllers/teacherController.js";
import { protect, protectTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

// Hoca girişi (public)
router.post("/login", teacherLogin);

// Hoca paneli (teacher auth)
router.get("/my-students", protectTeacher, getMyStudents);
router.post("/finalize", protectTeacher, finalizeApproval);

// Admin CRUD (admin auth) — parameterized route en sona
router.get("/", getTeachers);
router.post("/", protect, createTeacher);
router.put("/:id", protect, updateTeacher);
router.delete("/:id", protect, deleteTeacher);

export default router;
