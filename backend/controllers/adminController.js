import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import FormConfig from "../models/FormConfig.js";
import { runCascade } from "./teacherController.js";

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
      return res.status(400).json({ message: "Kullanıcı adı ve şifre zorunludur." });
    }

    const admin = await Admin.findOne({ username: username.trim() });
    const isMatch = admin ? await admin.comparePassword(password) : false;

    if (!admin || !isMatch) {
      return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı." });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      message: "Giriş başarılı",
      token,
      role: "admin",
      admin: { id: admin._id, username: admin.username },
    });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const [studentCount, assignedCount, form, teachers] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: "assigned" }),
      FormConfig.findOne(),
      Teacher.find().select("name hasFinalized maxQuota currentCount"),
    ]);

    const now = new Date();
    let formStatus = null;
    if (form) {
      const start = form.startDate ? new Date(form.startDate) : null;
      const end = form.endDate ? new Date(form.endDate) : null;
      const isOpen =
        (start || end)
          ? (!start || now >= start) && (!end || now <= end)
          : false;
      formStatus = {
        isOpen,
        startDate: form.startDate,
        endDate: form.endDate,
        cascadeDate: form.cascadeDate || null,
        cascadeExecuted: form.cascadeExecuted || false,
      };
    }

    const finalizedCount = teachers.filter((t) => t.hasFinalized).length;
    const allFinalized = teachers.length > 0 && finalizedCount === teachers.length;

    res.json({
      studentCount,
      teacherCount: teachers.length,
      assignedCount,
      unassignedCount: studentCount - assignedCount,
      formStatus,
      teachers,
      finalizedCount,
      allFinalized,
      admin: req.admin,
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard verisi alınamadı." });
  }
};

// Admin manual cascade
export const triggerCascade = async (req, res) => {
  try {
    const { force } = req.body;

    const [totalTeachers, finalizedCount] = await Promise.all([
      Teacher.countDocuments(),
      Teacher.countDocuments({ hasFinalized: true }),
    ]);

    const allFinalized = totalTeachers > 0 && finalizedCount === totalTeachers;

    if (!allFinalized && !force) {
      return res.status(409).json({
        message: `${totalTeachers - finalizedCount} danışman henüz öğrenci seçimini tamamlamadı.`,
        allFinalized: false,
        finalizedCount,
        totalTeachers,
      });
    }

    await runCascade();

    await FormConfig.findOneAndUpdate({}, { cascadeExecuted: true });

    const total = await Student.countDocuments();
    const assigned = await Student.countDocuments({ status: "assigned" });

    res.json({
      message: "Otomatik atama tamamlandı.",
      assignedCount: assigned,
      unassignedCount: total - assigned,
    });
  } catch (error) {
    res.status(500).json({ message: "Cascade sırasında hata oluştu." });
  }
};

export const getTeachersAdmin = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};

export const getAssignedStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("assignedTeacher")
      .populate("preferences");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Hata" });
  }
};
