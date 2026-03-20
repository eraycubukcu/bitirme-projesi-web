import express from "express";
import { submitForm } from "../controllers/studentController.js";

const router = express.Router();

router.post("/submit", submitForm);

export default router;
