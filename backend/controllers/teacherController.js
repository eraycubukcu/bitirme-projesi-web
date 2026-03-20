import Teacher from "../models/Teacher.js";

export const createTeacher = async (req, res) => {
  try {
    const { name, minQuota, maxQuota } = req.body;

    if (!name || minQuota === undefined || maxQuota === undefined) {
      return res.status(400).json({
        message: "Hoca ismi, min ve max öğrenci sayısı zorunludur.",
      });
    }

    if (minQuota > maxQuota) {
      return res.status(400).json({
        message: "Minimum sayısı maksimum sayısından büyük olamaz.",
      });
    }

    const teacher = await Teacher.create({
      bame,
      minQuota,
      maxQuota,
    });

    res.status(201).json({
      message: "Hoca eklendi.",
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server hatası",
      error: error.message,
    });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.json(teacher);
  } catch (error) {
    res.status(500).json({
      message: "Server hatası",
      error: error.message,
    });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    if (!teacher) {
      return res.status(400).json({
        message: "Hoca bulunamadı",
      });
    }

    await teacher.deleteOne();

    res.json({
      message: "Hoca silindi",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server hatası",
      error: error.message,
    });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, minQuota, maxQuota } = req.body;

    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return res.status(400).json({
        message: "Hoca bulunamadı.",
      });
    }

    // yeni değerleri kontrol edelim.
    const newMin = minQuota ?? teacher.minQuota;
    const newMax = maxQuota ?? teacher.maxQuota;

    if (newMin > newMax) {
      return res.status(400).json({
        message: "Minimum değer maksimum değerden büyük olamaz.",
      });
    }

    teacher.name = name ?? teacher.name;
    teacher.minQuota = newMin;
    teacher.maxQuota = newMax;

    await teacher.save();

    res.json({
      message: "Hoca güncellendi.",
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server hatası",
    });
  }
};
