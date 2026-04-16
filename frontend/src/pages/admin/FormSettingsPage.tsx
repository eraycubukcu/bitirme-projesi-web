import { useEffect, useState } from "react";
import api from "../../services/api";

const generateKey = (label: string) =>
  label
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

const formatDateLocal = (date: string) => {
  if (!date) return "";

  const d = new Date(date);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const FormSettingsPage = () => {
  const [form, setForm] = useState<any>({
    textFields: [],
    description: "",
    startDate: "",
    endDate: "",
  });

  const fetchForm = async () => {
    const res = await api.get("/form");

    setForm({
      ...res.data,
      startDate: res.data.startDate || "",
      endDate: res.data.endDate || "",
    });
  };

  useEffect(() => {
    fetchForm();
  }, []);

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...form.textFields];
    updated[index][key] = value;
    setForm({ ...form, textFields: updated });
  };

  const addField = () => {
    setForm((prev: any) => ({
      ...prev,
      textFields: [
        ...prev.textFields,
        { label: "", key: "", required: false, fixed: false },
      ],
    }));
  };

  const deleteField = (index: number) => {
    const updated = form.textFields.filter((_: any, i: number) => i !== index);
    setForm({ ...form, textFields: updated });
  };

  const handleSave = async () => {
    try {
      await api.put("/form", {
        textFields: form.textFields,
        description: form.description,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });

      alert("Kaydedildi");
      fetchForm();
    } catch (err) {
      console.log(err);
      alert("Hata oldu");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Form Ayarları</h1>

      <div className="mb-6">
        <label className="text-sm font-medium block mb-1">Açıklama</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-sm font-medium block mb-1">
            Başlangıç Tarihi
          </label>
          <input
            type="datetime-local"
            value={formatDateLocal(form.startDate)}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Bitiş Tarihi</label>
          <input
            type="datetime-local"
            value={formatDateLocal(form.endDate)}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="w-full border rounded-lg p-2"
          />
        </div>
      </div>

      <button
        onClick={addField}
        className="mb-6 bg-gray-900 text-white px-4 py-2 rounded-lg"
      >
        + Alan ekle
      </button>

      <div className="flex flex-col gap-4">
        {form.textFields.map((f: any, i: number) => (
          <div
            key={i}
            className="bg-white border rounded-xl shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex gap-2 items-center">
              <input
                placeholder="Alan adı (Ad Soyad)"
                value={f.label}
                onChange={(e) => {
                  const label = e.target.value;
                  updateField(i, "label", label);
                  updateField(i, "key", generateKey(label));
                }}
                className="border rounded-lg px-3 py-2 w-full"
              />

              {!f.fixed && (
                <button
                  onClick={() => deleteField(i)}
                  className="text-red-500 text-lg"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => updateField(i, "required", e.target.checked)}
                />
                Zorunlu alan
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="mt-4 w-full bg-gray-900 text-white py-3 rounded-lg font-medium"
      >
        Kaydet
      </button>
    </div>
  );
};

export default FormSettingsPage;
