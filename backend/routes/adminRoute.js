import express from "express";
import { adminLogin, getDashboard, assignStudents } from "../controllers/adminController.js";
import {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/dashboard", protect, getDashboard);
router.post("/assign", protect, assignStudents);

export default router;
