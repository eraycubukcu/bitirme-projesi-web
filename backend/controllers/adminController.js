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
    res.status(500).json({ message: "Server hatası", error: error.message });
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
      formStatus = { isOpen, startDate: form.startDate, endDate: form.endDate };
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

// Admin manual cascade — bazı hocalar onaylayamazsa admin devreye girer
export const triggerCascade = async (req, res) => {
  try {
    await runCascade();

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

export const assignStudents = async (req, res) => {
  try {
    const { studentId, teacherId } = req.body;

    const student = await Student.findById(studentId);
    const teacher = await Teacher.findById(teacherId);

    if (!student || !teacher) {
      return res.status(404).json({ message: "Veri bulunamadı" });
    }

    if (teacher.currentCount >= teacher.maxQuota) {
      return res.status(400).json({ message: "Bu hocanın kontenjanı dolu" });
    }

    if (student.assignedTeacher) {
      await Teacher.findByIdAndUpdate(student.assignedTeacher, {
        $inc: { currentCount: -1 },
      });
    }

    student.assignedTeacher = teacher._id;
    student.status = "assigned";
    await student.save();

    await Teacher.findByIdAndUpdate(teacher._id, { $inc: { currentCount: 1 } });

    res.json({ message: "Atama başarılı" });
  } catch (error) {
    res.status(500).json({ message: "Atama hatası" });
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
