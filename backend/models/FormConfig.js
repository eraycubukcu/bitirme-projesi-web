import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  label:     { type: String, required: true },
  key:       { type: String, required: true },
  required:  { type: Boolean, default: false },
  fixed:     { type: Boolean, default: false },
  fieldType: { type: String, enum: ["text", "email", "phone", "number"], default: "text" },
});

const formConfigSchema = new mongoose.Schema(
  {
    startDate:       { type: Date },
    endDate:         { type: Date },
    description:     { type: String },
    textFields:      [fieldSchema],
    cascadeDate:     { type: Date, default: null },
    cascadeExecuted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const FormConfig = mongoose.model("FormConfig", formConfigSchema);
export default FormConfig;
