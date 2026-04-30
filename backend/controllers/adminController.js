import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(400).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Şifre yanlış.",
      });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Giriş başarılı",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server hatası",
      error: error.message,
    });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    const teacherCount = await Teacher.countDocuments();

    res.json({
      studentCount,
      teacherCount,
      admin: req.admin,
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard verisi alınamadı." });
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

    // max quota kontrolü
    if (teacher.currentCount >= teacher.maxQuota) {
      return res.status(400).json({
        message: "Bu hocanın kontenjanı dolu",
      });
    }

    // eğer öğrenci zaten atanmışsa eski hocadan düş
    if (student.assignedTeacher) {
      await Teacher.findByIdAndUpdate(student.assignedTeacher, {
        $inc: { currentCount: -1 },
      });
    }

    // yeni hocaya ata
    student.assignedTeacher = teacher._id;
    await student.save();

    await Teacher.findByIdAndUpdate(teacher._id, {
      $inc: { currentCount: 1 },
    });

    res.json({ message: "Atama başarılı" });
  } catch (error) {
    res.status(500).json({ message: "Atama hatası" });
  }
};

export const getAssignedStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("assignedTeacher");

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Hata" });
  }
};