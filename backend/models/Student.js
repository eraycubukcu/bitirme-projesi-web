import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    formData: {
      type: Object,
      required: true,
    },

    preferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],

    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    status: {
      type: String,
      enum: ["unassigned", "assigned"],
      default: "unassigned",
    },
  },
  { timestamps: true },
);

const Student = mongoose.model("Student", studentSchema);
export default Student;

// form verisinden gelen bilgiler
// hoca tercihleri
// admin tarafından atanan öğrenci bilgisi
