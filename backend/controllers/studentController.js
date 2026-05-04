import FormConfig from "../models/FormConfig.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

export const submitForm = async (req, res) => {
  try {
    const { formData, preferences } = req.body;

    const form = await FormConfig.findOne();

    if (!form) {
      return res.status(403).json({ message: "Form bulunamadı." });
    }

    // Form açık mı? Tarih aralığına göre kontrol et
    const now = new Date();
    const start = form.startDate ? new Date(form.startDate) : null;
    const end = form.endDate ? new Date(form.endDate) : null;

    // Tarih girilmemişse form kapalı
    const isOpen = (start || end) && (!start || now >= start) && (!end || now <= end);

    if (!isOpen) {
      if (start && now < start) {
        return res.status(403).json({ message: "Form henüz açılmadı." });
      }
      return res.status(403).json({ message: "Başvuru süresi sona erdi." });
    }

    // Zorunlu alanlar doldurulmuş mu
    for (let field of form.textFields) {
      if (field.required && !formData[field.key]?.toString().trim()) {
        return res.status(400).json({ message: `${field.label} zorunlu` });
      }
    }

    const teacherCount = await Teacher.countDocuments();

    if (preferences.length !== teacherCount) {
      return res.status(400).json({ message: "Tüm hocaları sıralamalısınız" });
    }

    const unique = new Set(preferences);
    if (unique.size !== preferences.length) {
      return res.status(400).json({ message: "Aynı hoca birden fazla seçilemez" });
    }

    for (let teacherId of preferences) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(400).json({ message: "Hoca bulunamadı" });
      }
    }

    const student = await Student.create({ formData, preferences });

    res.status(201).json({ message: "Form gönderildi", student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server hatası" });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("preferences")
      .populate("assignedTeacher")
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Öğrenciler alınamadı" });
  }
};
