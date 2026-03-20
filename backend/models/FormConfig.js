import mongoose from "mongoose";

// form alanlarını belirleme
const fieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  fixed: {
    type: Boolean,
    default: false,
  },
});

const formConfigSchema = new mongoose.Schema(
  {
    // form sadece belirli zamanlarda açık olacak.
    isActive: {
      type: Boolean,
      default: false,
    },
    textFields: [fieldSchema],
  },
  { timestamps: true },
);

const FormConfig = mongoose.model("FormConfig", formConfigSchema);
export default FormConfig;

// fieldSchema'dan gelen fieldlar formConfigSchema'ya ekleniyor.
// ayrıca formun aktiflik durumunu kontrol eden isActive mekanizması.
