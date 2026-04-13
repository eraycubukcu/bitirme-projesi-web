import express from "express";
import { getStudents, submitForm } from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getStudents);
router.post("/submit", submitForm);

export default router;
