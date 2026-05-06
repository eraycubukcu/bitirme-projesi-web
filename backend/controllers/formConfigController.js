import FormConfig from "../models/FormConfig.js";

export const getForm = async (req, res) => {
  try {
    const form = await FormConfig.findOne();
    if (!form) return res.status(404).json({ message: "Form bulunamadı." });
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: "Server hatası", error: error.message });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { textFields, description, startDate, endDate, uniqueField, cascadeDate } = req.body;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "Kapanış tarihi açılış tarihinden sonra olmalıdır." });
    }

    let form = await FormConfig.findOne();

    if (!form) {
      form = new FormConfig({
        textFields, description, startDate, endDate,
        uniqueField: uniqueField || null,
        cascadeDate: cascadeDate || null,
        cascadeExecuted: false,
      });
    } else {
      const fixedFields = form.textFields.filter((f) => f.fixed);
      form.textFields   = [...fixedFields, ...textFields.filter((f) => !f.fixed)];
      form.description  = description  !== undefined ? description  : form.description;
      form.startDate    = startDate    !== undefined ? startDate    : form.startDate;
      form.endDate      = endDate      !== undefined ? endDate      : form.endDate;
      form.uniqueField  = uniqueField  !== undefined ? (uniqueField || null) : form.uniqueField;

      if (cascadeDate !== undefined) {
        const newDate = cascadeDate ? new Date(cascadeDate) : null;
        const oldDate = form.cascadeDate || null;

        const dateChanged =
          (newDate === null && oldDate !== null) ||
          (newDate !== null && oldDate === null) ||
          (newDate !== null && oldDate !== null &&
            Math.abs(newDate.getTime() - oldDate.getTime()) > 1000);

        form.cascadeDate = newDate;
        if (dateChanged) form.cascadeExecuted = false;
      }
    }

    await form.save();
    res.json({ message: "Form güncellendi.", form });
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};
