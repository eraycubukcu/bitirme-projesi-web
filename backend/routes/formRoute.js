import express from "express";
import { getForm, updateForm } from "../controllers/formConfigController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getForm); // public form
router.put("/", protect, updateForm); // admine özel form güncelleme

export default router;
