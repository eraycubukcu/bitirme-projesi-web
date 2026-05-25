import bcrypt from "bcryptjs";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234u";

// ─── Cascade algoritması ──────────────────────────────────────────────────────
let cascadeLock = false;

async function runCascade() {
  if (cascadeLock) return;
  cascadeLock = true;

  try {
    let madeAssignment = true;

    while (madeAssignment) {
      madeAssignment = false;

      const unassigned = await Student.find({ status: "unassigned" });
      if (unassigned.length === 0) break;

      const allTeachers = await Teacher.find();
      const teacherMap = new Map(allTeachers.map((t) => [t._id.toString(), t]));

      const teacherCandidates = new Map();

      for (const student of unassigned) {
        let matched = false;
        for (let i = 0; i < student.preferences.length; i++) {
          const teacherId = student.preferences[i]?.toString();
          if (!teacherId) continue;
          const teacher = teacherMap.get(teacherId);
          if (teacher && teacher.currentCount < teacher.maxQuota) {
            if (!teacherCandidates.has(teacherId)) {
              teacherCandidates.set(teacherId, []);
            }
            teacherCandidates.get(teacherId).push(student);
            matched = true;
            break;
          }
        }
        if (!matched) { /* uygun hoca yok — öğrenci unassigned kalır */ }
      }

      for (const [teacherId, candidates] of teacherCandidates) {
        const teacher = teacherMap.get(teacherId);
        if (!teacher) continue;

        const availableSlots = teacher.maxQuota - teacher.currentCount;
        if (availableSlots <= 0) continue;

        candidates.sort((a, b) => {
          const gpaA = parseFloat(a.formData?.gpa ?? "") || 0;
          const gpaB = parseFloat(b.formData?.gpa ?? "") || 0;
          return gpaB - gpaA;
        });

        const toAssign = candidates.slice(0, availableSlots);

        for (const student of toAssign) {
          const updated = await Teacher.findOneAndUpdate(
            { _id: teacher._id, $expr: { $lt: ["$currentCount", "$maxQuota"] } },
            { $inc: { currentCount: 1 } },
            { new: true },
          );
          if (!updated) continue;

          student.assignedTeacher = teacher._id;
          student.status = "assigned";
          await student.save();
          teacher.currentCount = updated.currentCount;
          madeAssignment = true;
        }
      }
    }

  } finally {
    cascadeLock = false;
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

    if (typeof password !== "string" || password.length > 128) {
      return res.status(400).json({ message: "Geçersiz şifre." });
    }

    const teacher = await Teacher.findOne({ username: username.trim() });
    const isMatch = teacher
      ? await teacher.comparePassword(password)
      : (await bcrypt.compare(password, DUMMY_HASH), false);

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
    res.status(500).json({ message: "Server hatası" });
  }
};

// ─── Hoca paneli ──────────────────────────────────────────────────────────────
export const getMyStudents = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    const teacher = await Teacher.findById(teacherId);

    const [approvedStudents, waitingStudents] = await Promise.all([
      Student.find({
        assignedTeacher: teacherId,
        "preferences.0": teacherId,
      }).populate("preferences"),
      Student.find({
        "preferences.0": teacherId,
        status: "unassigned",
      }).populate("preferences"),
    ]);

    res.json({ students: waitingStudents, approvedStudents, teacher });
  } catch (error) {
    res.status(500).json({ message: "Öğrenciler alınamadı" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    if (typeof bio !== "string") {
      return res.status(400).json({ message: "Geçersiz veri." });
    }
    const teacher = await Teacher.findByIdAndUpdate(
      req.teacher._id,
      { bio: bio.trim().slice(0, 1000) },
      { new: true }
    );
    res.json({ message: "Profil güncellendi.", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
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
        status: "assigned",
      });
      for (const student of previouslyApproved) {
        student.assignedTeacher = null;
        student.status = "unassigned";
        await student.save();
      }
      const actualCount = await Student.countDocuments({ assignedTeacher: teacherId, status: "assigned" });
      await Teacher.findByIdAndUpdate(teacherId, {
        currentCount: actualCount,
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

    if (minQuota < 0 || maxQuota < 1) {
      return res.status(400).json({
        message: "Minimum 0 veya üstü, maksimum 1 veya üstü olmalıdır.",
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
    res.status(500).json({ message: "Server hatası" });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().select("_id name bio").sort({ createdAt: -1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
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

    await Student.updateMany(
      { preferences: req.params.id },
      { $pull: { preferences: req.params.id } },
    );

    res.json({ message: "Hoca silindi" });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
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
