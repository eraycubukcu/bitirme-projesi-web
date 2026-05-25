import FormConfig from "../models/FormConfig.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

export const submitForm = async (req, res) => {
  try {
    const { formData, preferences } = req.body;

    if (!formData || typeof formData !== "object" || !Array.isArray(preferences)) {
      return res.status(400).json({ message: "Geçersiz istek." });
    }

    const form = await FormConfig.findOne();

    if (!form) {
      return res.status(403).json({ message: "Form bulunamadı." });
    }

    // Form açık mı?
    const now = new Date();
    const start = form.startDate ? new Date(form.startDate) : null;
    const end = form.endDate ? new Date(form.endDate) : null;
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
          const digits = value.replace(/[\s\-().]/g, "");
          if (!/^\+?\d{7,15}$/.test(digits)) {
            return res.status(400).json({ message: `"${field.label}" geçerli bir telefon numarası olmalıdır.` });
          }
        } else if (field.key === "gpa") {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0 || num > 4 || !/^\d(\.\d{1,2})?$/.test(value)) {
            return res.status(400).json({ message: `"${field.label}" 0 ile 4 arasında, en fazla 2 ondalık basamaklı olmalıdır.` });
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

    for (const teacherId of preferences) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(400).json({ message: "Hoca bulunamadı" });
      }
    }

    // Clerk ile giriş yapılmışsa upsert, yoksa yeni kayıt (eski akış)
    let student;
    if (req.student?.clerkUserId) {
      try {
        student = await Student.findOneAndUpdate(
          { clerkUserId: req.student.clerkUserId, status: { $ne: "assigned" } },
          {
            $set: {
              formData,
              preferences,
              email: req.student.email,
              firstName: req.student.firstName,
              lastName: req.student.lastName,
            },
            $setOnInsert: { status: "unassigned" },
          },
          { upsert: true, new: true },
        );
      } catch (err) {
        if (err.code === 11000) {
          return res.status(403).json({ message: "Danışman atamanız tamamlandı, tercihleriniz artık değiştirilemez." });
        }
        throw err;
      }
    } else {
      student = await Student.create({ formData, preferences });
    }

    res.status(201).json({ message: "Form gönderildi", student });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};

export const getMySubmission = async (req, res) => {
  try {
    const student = await Student.findOne({ clerkUserId: req.student.clerkUserId })
      .populate("preferences")
      .populate("assignedTeacher");

    res.json({ student: student || null });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find({ formData: { $ne: {} } })
      .populate("preferences")
      .populate("assignedTeacher")
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Öğrenciler alınamadı" });
  }
};
