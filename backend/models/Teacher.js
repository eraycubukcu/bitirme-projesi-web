import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    minQuota: {
      type: Number,
      required: true,
      min: 0,
    },
    maxQuota: {
      type: Number,
      required: true,
      min: 1,
    },
    currentCount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;

// Hoca adı, minimum öğrenci , maksimum öğrenci , mevcut öğrenci sayısı
