import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
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
      default: 0,
    },
    hasFinalized: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

teacherSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

teacherSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

teacherSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
