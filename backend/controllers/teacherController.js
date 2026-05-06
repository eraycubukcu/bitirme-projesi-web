import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";

// ─── Cascade algoritması ──────────────────────────────────────────────────────
// Tüm hocalar onayladıktan sonra atanmamış öğrencileri sıradaki uygun
// tercihlerine atar. preferences[0] hocanın zaten onaylamadığı bilinir,
// bu yüzden i=1'den başlanır.
async function runCascade() {
  const unassigned = await Student.find({ status: "unassigned" });

  for (const student of unassigned) {
    for (let i = 1; i < student.preferences.length; i++) {
      const nextTeacher = await Teacher.findById(student.preferences[i]);
      if (nextTeacher && nextTeacher.currentCount < nextTeacher.maxQuota) {
        student.assignedTeacher = nextTeacher._id;
        student.status = "assigned";
        await student.save();
        await Teacher.findByIdAndUpdate(nextTeacher._id, {
          $inc: { currentCount: 1 },
        });
        break;
      }
    }
  }
}

export { runCascade };

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const teacherLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
      return res.status(400).json({ message: "Kullanıcı adı ve şifre zorunludur." });
    }

    const teacher = await Teacher.findOne({ username: username.trim() });
    const isMatch = teacher ? await teacher.comparePassword(password) : false;

    if (!teacher || !isMatch) {
      return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı." });
    }

    const token = jwt.sign(
      { id: teacher._id, role: "teacher" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({ message: "Giriş başarılı", token, role: "teacher", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server hatası", error: error.message });
  }
};

// ─── Hoca paneli ──────────────────────────────────────────────────────────────
export const getMyStudents = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    const teacher = await Teacher.findById(teacherId);

    const [totalTeachers, finalizedCount] = await Promise.all([
      Teacher.countDocuments(),
      Teacher.countDocuments({ hasFinalized: true }),
    ]);

    // Onaylanmış (bu hocaya atanmış, 1. tercihi bu hoca olan) öğrenciler
    const approvedStudents = await Student.find({
      assignedTeacher: teacherId,
      "preferences.0": teacherId,
    }).populate("preferences");

    // Bekleyen (henüz atanmamış, 1. tercihi bu hoca olan) öğrenciler
    const waitingStudents = await Student.find({
      "preferences.0": teacherId,
      status: "unassigned",
    }).populate("preferences");

    res.json({ students: waitingStudents, approvedStudents, teacher, finalizedCount, totalTeachers });
  } catch (error) {
    res.status(500).json({ message: "Öğrenciler alınamadı" });
  }
};

export const finalizeApproval = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    const { approvedStudentIds } = req.body;

    let teacher = await Teacher.findById(teacherId);

    // Güncelleme: önceki onayları geri al (re-finalizasyon desteği)
    if (teacher.hasFinalized) {
      const previouslyApproved = await Student.find({
        assignedTeacher: teacherId,
        "preferences.0": teacherId,
      });
      for (const student of previouslyApproved) {
        student.assignedTeacher = null;
        student.status = "unassigned";
        await student.save();
      }
      await Teacher.findByIdAndUpdate(teacherId, {
        $inc: { currentCount: -previouslyApproved.length },
        hasFinalized: false,
      });
      teacher = await Teacher.findById(teacherId);
    }

    // Kontenjan kontrolü
    if (teacher.currentCount + approvedStudentIds.length > teacher.maxQuota) {
      return res.status(400).json({
        message: "Seçilen öğrenci sayısı kontenjanı aşıyor.",
      });
    }

    // Onaylanan öğrencileri ata
    const waitingStudents = await Student.find({
      "preferences.0": teacherId,
      status: "unassigned",
    });

    for (const student of waitingStudents) {
      if (approvedStudentIds.includes(student._id.toString())) {
        student.assignedTeacher = teacherId;
        student.status = "assigned";
        await student.save();
        await Teacher.findByIdAndUpdate(teacherId, {
          $inc: { currentCount: 1 },
        });
      }
    }

    // Hocanın onay durumunu işaretle
    await Teacher.findByIdAndUpdate(teacherId, { hasFinalized: true });

    const pendingCount = await Teacher.countDocuments({ hasFinalized: false });
    const totalTeachers = await Teacher.countDocuments();
    const finalizedCount = totalTeachers - pendingCount;
    const allFinalized = pendingCount === 0;

    // Otomatik cascade kaldırıldı — admin "Manuel Başlat" ile tetikler

    res.json({
      message: `Onayınız alındı. ${finalizedCount}/${totalTeachers} hoca tamamladı.`,
      allFinalized,
      finalizedCount,
      totalTeachers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};

// ─── Admin CRUD ───────────────────────────────────────────────────────────────
export const createTeacher = async (req, res) => {
  try {
    const { name, username, password, minQuota, maxQuota } = req.body;

    if (!name || !username || !password || minQuota === undefined || maxQuota === undefined) {
      return res.status(400).json({
        message: "İsim, kullanıcı adı, şifre, min ve max öğrenci sayısı zorunludur.",
      });
    }

    if (minQuota > maxQuota) {
      return res.status(400).json({
        message: "Minimum sayısı maksimum sayısından büyük olamaz.",
      });
    }

    const existing = await Teacher.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
    }

    const teacher = await Teacher.create({ name, username, password, minQuota, maxQuota });
    res.status(201).json({ message: "Hoca eklendi.", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server hatası", error: error.message });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Server hatası", error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const assignedCount = await Student.countDocuments({ assignedTeacher: req.params.id });
    if (assignedCount > 0) {
      return res.status(400).json({
        message: `Bu hocaya atanmış ${assignedCount} öğrenci var. Önce öğrencileri yeniden atayın.`,
      });
    }

    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(400).json({ message: "Hoca bulunamadı" });
    }
    res.json({ message: "Hoca silindi" });
  } catch (error) {
    res.status(500).json({ message: "Server hatası", error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, minQuota, maxQuota } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(400).json({ message: "Hoca bulunamadı." });
    }

    const newMin = minQuota ?? teacher.minQuota;
    const newMax = maxQuota ?? teacher.maxQuota;

    if (newMin > newMax) {
      return res.status(400).json({
        message: "Minimum değer maksimum değerden büyük olamaz.",
      });
    }

    if (newMax < teacher.currentCount) {
      return res.status(400).json({
        message: `Maksimum kontenjan mevcut öğrenci sayısından (${teacher.currentCount}) küçük olamaz.`,
      });
    }

    if (username && username !== teacher.username) {
      const existing = await Teacher.findOne({ username });
      if (existing) {
        return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
      }
      teacher.username = username;
    }

    teacher.name = name ?? teacher.name;
    teacher.minQuota = newMin;
    teacher.maxQuota = newMax;
    if (password) teacher.password = password;

    await teacher.save();
    res.json({ message: "Hoca güncellendi.", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};
