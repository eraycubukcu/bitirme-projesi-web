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

    // Alan doğrulaması
    for (const field of form.textFields) {
      const value = formData[field.key]?.toString().trim() || "";

      if (field.required && !value) {
        return res.status(400).json({ message: `"${field.label}" alanı boş bırakılamaz.` });
      }

      if (value) {
        if (field.fieldType === "email") {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(value)) {
            return res.status(400).json({ message: `"${field.label}" geçerli bir e-posta adresi olmalıdır.` });
          }
        } else if (field.fieldType === "phone") {
          const digits = value.replace(/[\s\-().+]/g, "");
          if (!/^\d+$/.test(digits) || digits.length < 7) {
            return res.status(400).json({ message: `"${field.label}" geçerli bir telefon numarası olmalıdır.` });
          }
        } else if (field.fieldType === "number") {
          if (!/^\d+$/.test(value)) {
            return res.status(400).json({ message: `"${field.label}" yalnızca rakam içermelidir.` });
          }
        }
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

    // Tekrar başvuru kontrolü
    if (form.uniqueField) {
      const uniqueValue = formData[form.uniqueField]?.toString().trim();
      if (uniqueValue) {
        const existing = await Student.findOne({
          [`formData.${form.uniqueField}`]: uniqueValue,
        });
        if (existing) {
          const fieldLabel = form.textFields.find((f) => f.key === form.uniqueField)?.label || form.uniqueField;
          return res.status(400).json({
            message: `Bu ${fieldLabel} ile daha önce başvuru yapılmış.`,
          });
        }
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
