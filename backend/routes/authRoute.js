import express from "express";
import { requireStudent } from "../middleware/clerkAuth.js";

const router = express.Router();

// Domain doğrulaması yapar ve oturumu onaylar
// Student kaydı submit sırasında oluşturulur (sync'te oluşturulmuyor)
router.post("/sync", requireStudent, (req, res) => {
  res.json({ ok: true, email: req.student.email });
});

export default router;
