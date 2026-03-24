import FormConfig from "../models/FormConfig.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

export const submitForm = async (req, res) => {
  try {
    const { formData, preferences } = req.body;

    // form aktif mi kontrol edelim
    const form = await FormConfig.findOne();

    if (!form || !form.isActive) {
      return res.status(403).json({
        message: "Form aktif değil.",
      });
    }

    // zorunlu alanları kontrol edelim doldurulmuş mu
    for (let field of form.textFields) {
      if (field.required && !formData[field.key]?.toString().trim()) {
        return res.status(400).json({
          message: `${field.label} zorunlu`,
        });
      }
    }

    const teacherCount = await Teacher.countDocuments();

    if (preferences.length !== teacherCount) {
      return res.status(400).json({
        message: "Tüm hocaları sıralamalısınız",
      });
    }

    // duplicate kontrol
    const unique = new Set(preferences);

    if (unique.size !== preferences.length) {
      return res.status(400).json({
        message: "Aynı hoca birden fazla seçilemez",
      });
    }

    for (let teacherId of preferences) {
      const teacher = await Teacher.findById(teacherId);

      if (!teacher) {
        return res.status(400).json({
          message: "Hoca bulunamadı",
        });
      }
    }

    const student = await Student.create({
      formData,
      preferences,
    });

    res.status(201).json({
      message: "Form gönderildi",
      student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server hatası",
    });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({
      message: "Server hatası",
      error: error.message,
    });
  }
};
