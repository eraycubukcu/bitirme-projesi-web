import express from "express";
import { getStudents, submitForm } from "../controllers/studentController.js";

const router = express.Router();

router.get("/", getStudents);
router.post("/submit", submitForm);

export default router;
