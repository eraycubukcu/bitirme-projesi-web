import FormConfig from "../models/FormConfig.js";

// Not ortalaması alanı cascade için zorunlu; her zaman sabit ve required kalmalı
function enforceGpaField(fields) {
  const idx = fields.findIndex((f) => f.key === "gpa");
  if (idx === -1) {
    fields.push({ label: "Not Ortalaması", key: "gpa", required: true, fixed: true, fieldType: "number" });
  } else {
    fields[idx].fixed = true;
    fields[idx].required = true;
  }
  return fields;
}

export const getForm = async (req, res) => {
  try {
    const form = await FormConfig.findOne();
    if (!form) return res.status(404).json({ message: "Form bulunamadı." });

    // Mevcut veritabanındaki gpa alanını da fixed+required'a migrate et
    const gpaField = form.textFields.find((f) => f.key === "gpa");
    if (gpaField && (!gpaField.fixed || !gpaField.required)) {
      enforceGpaField(form.textFields);
      await form.save();
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: "Server hatası" });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { textFields, description, startDate, endDate, cascadeDate } = req.body;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "Kapanış tarihi açılış tarihinden sonra olmalıdır." });
    }

    if (cascadeDate && startDate && new Date(cascadeDate) < new Date(startDate)) {
      return res.status(400).json({ message: "Otomatik atama tarihi form açılış tarihinden önce olamaz." });
    }

    let form = await FormConfig.findOne();

    if (!form) {
      form = new FormConfig({
        textFields: enforceGpaField(textFields ?? []),
        description, startDate, endDate,
        cascadeDate: cascadeDate || null,
        cascadeExecuted: false,
      });
    } else {
      const fixedFields = form.textFields.filter((f) => f.fixed);
      form.textFields   = enforceGpaField([...fixedFields, ...textFields.filter((f) => !f.fixed)]);
      form.description  = description  !== undefined ? description  : form.description;
      form.startDate    = startDate    !== undefined ? startDate    : form.startDate;
      form.endDate      = endDate      !== undefined ? endDate      : form.endDate;

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
