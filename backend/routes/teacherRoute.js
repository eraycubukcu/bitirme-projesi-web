import express from "express";
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachers,
} from "../controllers/teacherController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getTeachers);
router.post("/", protect, createTeacher);
router.put("/:id", protect, updateTeacher);
router.delete("/:id", protect, deleteTeacher);

export default router;
