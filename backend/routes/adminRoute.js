import express from "express";
import {
  adminLogin,
  getDashboard,
  assignStudents,
  getAssignedStudents,
  triggerCascade,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/dashboard", protect, getDashboard);
router.post("/assigned", protect, assignStudents);
router.get("/assigned", protect, getAssignedStudents);
router.post("/cascade", protect, triggerCascade);

export default router;
