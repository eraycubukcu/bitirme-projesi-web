import express from "express";
import { getStudents, submitForm, getMySubmission } from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireStudent } from "../middleware/clerkAuth.js";

const router = express.Router();

router.get("/", protect, getStudents);
router.get("/me", requireStudent, getMySubmission);
router.post("/submit", requireStudent, submitForm);

export default router;
