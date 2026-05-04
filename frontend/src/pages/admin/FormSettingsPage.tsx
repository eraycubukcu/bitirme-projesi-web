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

// UTC ISO string → datetime-local format (yerel saat)
const toLocalInput = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

// datetime-local value (yerel saat) → UTC ISO string
const toUTC = (local: string): string | null => {
  if (!local) return null;
  return new Date(local).toISOString();
};

// Form açık mı kontrolü: ISO string veya datetime-local string kabul eder
const calcIsOpen = (start: string, end: string): boolean => {
  const now = Date.now();
  const s = start ? new Date(start).getTime() : null;
  const e = end ? new Date(end).getTime() : null;
  if (!s && !e) return false; // tarih ayarlanmamışsa kapalı
  return (!s || now >= s) && (!e || now <= e);
};

const FormSettingsPage = () => {
  const [form, setForm] = useState<any>({
    textFields: [],
    description: "",
    startDate: "",
    endDate: "",
  });
  // input'ların gösterdiği değer (datetime-local formatı, yerel saat)
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchForm = async () => {
    const res = await api.get("/form");
    const data = res.data;
    setForm(data);
    setStartInput(toLocalInput(data.startDate || ""));
    setEndInput(toLocalInput(data.endDate || ""));
  };

  useEffect(() => {
    fetchForm();
  }, []);

  // Badge için: input'taki mevcut değerleri kullan (kayıt öncesi de göster)
  const isOpen = calcIsOpen(startInput, endInput);

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
    if (startInput && endInput && new Date(startInput) >= new Date(endInput)) {
      alert("Kapanış tarihi açılış tarihinden sonra olmalıdır.");
      return;
    }

    setSaving(true);
    try {
      await api.put("/form", {
        textFields: form.textFields,
        description: form.description,
        startDate: toUTC(startInput),  // yerel → UTC
        endDate: toUTC(endInput),       // yerel → UTC
      });
      await fetchForm(); // kayıt sonrası yeniden çek
      alert("Kaydedildi.");
    } catch {
      alert("Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDates = async () => {
    if (!window.confirm("Tarih ayarları silinsin mi? Form kapalı kalacak.")) return;
    setSaving(true);
    try {
      await api.put("/form", {
        textFields: form.textFields,
        description: form.description,
        startDate: null,
        endDate: null,
      });
      setStartInput("");
      setEndInput("");
      await fetchForm();
    } catch {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Başlık + durum */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Form Ayarları</h1>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            isOpen
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isOpen ? "Form Açık" : "Form Kapalı"}
        </span>
      </div>

      {/* Açıklama */}
      <div className="mb-6">
        <label className="text-sm font-medium block mb-1">Açıklama</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-gray-900"
          rows={3}
        />
      </div>

      {/* Tarih aralığı */}
      <div className="bg-gray-50 border rounded-xl p-4 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Başvuru Tarihi ve Saati
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Açılış
            </label>
            <input
              type="datetime-local"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Kapanış
            </label>
            <input
              type="datetime-local"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Özet satırı */}
        {(startInput || endInput) && (
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>
              {startInput
                ? new Date(startInput).toLocaleString("tr-TR")
                : "—"}{" "}
              →{" "}
              {endInput
                ? new Date(endInput).toLocaleString("tr-TR")
                : "—"}
            </span>
            <button
              onClick={handleClearDates}
              disabled={saving}
              className="text-red-400 hover:text-red-600 text-xs ml-4"
            >
              Tarihleri temizle
            </button>
          </div>
        )}

        {!startInput && !endInput && (
          <p className="text-xs text-gray-400">
            Tarih girilmediği sürece form kapalı kalır.
          </p>
        )}
      </div>

      {/* Form alanları */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Form Alanları</h2>
        <button
          onClick={addField}
          className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm"
        >
          + Alan ekle
        </button>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {form.textFields.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4 border rounded-lg">
            Henüz alan eklenmedi.
          </p>
        )}
        {form.textFields.map((f: any, i: number) => (
          <div
            key={i}
            className="bg-white border rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex gap-2 items-center">
              <input
                placeholder="Alan adı (örn: Ad Soyad)"
                value={f.label}
                disabled={f.fixed}
                onChange={(e) => {
                  const label = e.target.value;
                  updateField(i, "label", label);
                  updateField(i, "key", generateKey(label));
                }}
                className="border rounded-lg px-3 py-2 w-full text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              {!f.fixed && (
                <button
                  onClick={() => deleteField(i)}
                  className="text-red-400 hover:text-red-600 text-xl leading-none"
                >
                  ✕
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={f.required}
                onChange={(e) => updateField(i, "required", e.target.checked)}
              />
              Zorunlu alan
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium disabled:opacity-50 transition"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </div>
  );
};

export default FormSettingsPage;
