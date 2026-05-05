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

    const teacher = await Teacher.findOne({ username });
    if (!teacher) {
      return res.status(400).json({ message: "Kullanıcı bulunamadı." });
    }

    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Şifre yanlış." });
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

    // Güncel hoca verisini çek (hasFinalized dahil)
    const teacher = await Teacher.findById(teacherId);

    const [totalTeachers, finalizedCount] = await Promise.all([
      Teacher.countDocuments(),
      Teacher.countDocuments({ hasFinalized: true }),
    ]);

    // Zaten onaylamışsa boş liste döndür
    if (teacher.hasFinalized) {
      return res.json({ students: [], teacher, finalizedCount, totalTeachers });
    }

    const students = await Student.find({
      "preferences.0": teacherId,
      status: { $ne: "assigned" },
    }).populate("preferences");

    res.json({ students, teacher, finalizedCount, totalTeachers });
  } catch (error) {
    res.status(500).json({ message: "Öğrenciler alınamadı" });
  }
};

export const finalizeApproval = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    const { approvedStudentIds } = req.body;

    const teacher = await Teacher.findById(teacherId);

    // Çift onay koruması
    if (teacher.hasFinalized) {
      return res.status(400).json({ message: "Zaten onayladınız." });
    }

    // Kontenjan kontrolü
    if (teacher.currentCount + approvedStudentIds.length > teacher.maxQuota) {
      return res.status(400).json({
        message: "Seçilen öğrenci sayısı kontenjanı aşıyor.",
      });
    }

    // 1. Onaylanan öğrencileri ata
    const waitingStudents = await Student.find({
      "preferences.0": teacherId,
      status: { $ne: "assigned" },
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
      // Onaylanmayanlar 'unassigned' kalır — cascade bekliyor
    }

    // 2. Hocanın onay durumunu işaretle
    await Teacher.findByIdAndUpdate(teacherId, { hasFinalized: true });

    // 3. Tüm hocalar onayladı mı?
    const pendingCount = await Teacher.countDocuments({ hasFinalized: false });
    const allFinalized = pendingCount === 0;
    const totalTeachers = await Teacher.countDocuments();
    const finalizedCount = totalTeachers - pendingCount;

    // 4. Hepsi onayladıysa cascade çalıştır
    if (allFinalized) {
      await runCascade();
    }

    res.json({
      message: allFinalized
        ? "Tüm hocalar onayladı. Otomatik atama gerçekleştirildi."
        : `Onayınız alındı. ${finalizedCount}/${totalTeachers} hoca tamamladı.`,
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
