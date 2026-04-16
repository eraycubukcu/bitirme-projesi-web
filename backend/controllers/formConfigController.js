import FormConfig from "../models/FormConfig.js";

// formu gösterme işi public
export const getForm = async (req, res) => {
  try {
    const form = await FormConfig.findOne();

    if (!form) {
      return res.status(404).json({
        message: "Form bulunamadı.",
      });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({
      message: "Server hatası",
      error: error.message,
    });
  }
};

// formu güncelleme işi only admin
export const updateForm = async (req, res) => {
  try {
    const { textFields, isActive, description, startDate, endDate } = req.body;

    let form = await FormConfig.findOne();

    if (!form) {
      form = new FormConfig({
        textFields,
        isActive,
        description,
      });
    } else {
      const fixedFields = form.textFields.filter((f) => f.fixed);

      form.textFields = [...fixedFields, ...textFields.filter((f) => !f.fixed)];
      form.isActive = isActive ?? form.isActive;
      form.description = description ?? form.description;
      form.startDate = startDate ?? form.startDate;
      form.endDate = endDate ?? form.endDate;
    }

    await form.save();
    res.json({
      message: "Form güncellendi.",
      form,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server hatası",
    });
  }
};
