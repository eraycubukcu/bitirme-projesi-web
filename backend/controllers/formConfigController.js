import FormConfig from "../models/FormConfig.js";

export const getForm = async (req, res) => {
  try {
    const form = await FormConfig.findOne();

    if (!form) {
      return res.status(404).json({ message: "Form bulunamadı." });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: "Server hatası", error: error.message });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { textFields, description, startDate, endDate } = req.body;

    let form = await FormConfig.findOne();

    if (!form) {
      form = new FormConfig({ textFields, description, startDate, endDate });
    } else {
      const fixedFields = form.textFields.filter((f) => f.fixed);
      form.textFields = [...fixedFields, ...textFields.filter((f) => !f.fixed)];
      form.description = description !== undefined ? description : form.description;
      form.startDate = startDate !== undefined ? startDate : form.startDate;
      form.endDate = endDate !== undefined ? endDate : form.endDate;
    }

    await form.save();
    res.json({ message: "Form güncellendi.", form });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};
