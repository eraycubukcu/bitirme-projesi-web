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

const toLocalInput = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

const toUTC = (local: string): string | null => {
  if (!local) return null;
  return new Date(local).toISOString();
};

const calcIsOpen = (start: string, end: string): boolean => {
  const now = Date.now();
  const s = start ? new Date(start).getTime() : null;
  const e = end ? new Date(end).getTime() : null;
  if (!s && !e) return false;
  return (!s || now >= s) && (!e || now <= e);
};

const FormSettingsPage = () => {
  const [form, setForm] = useState<any>({ textFields: [], description: "", startDate: "", endDate: "" });
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
  const [dateError, setDateError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearError, setClearError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [newFieldType, setNewFieldType] = useState("text");

  const fetchForm = async () => {
    try {
      const res = await api.get("/form");
      const data = res.data;
      setForm(data);
      setStartInput(toLocalInput(data.startDate || ""));
      setEndInput(toLocalInput(data.endDate || ""));
      setIsDirty(false);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setFetchError("Form ayarları yüklenemedi.");
      }
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { fetchForm(); }, []);

  const isOpen = calcIsOpen(startInput, endInput);

  const markDirty = () => {
    setIsDirty(true);
    setSaveResult(null);
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...form.textFields];
    updated[index][key] = value;
    setForm({ ...form, textFields: updated });
    markDirty();
  };

  const openAddModal = () => {
    setNewLabel("");
    setNewRequired(false);
    setNewFieldType("text");
    setShowAddModal(true);
  };

  const confirmAddField = () => {
    if (!newLabel.trim()) return;
    setForm((prev: any) => ({
      ...prev,
      textFields: [
        ...prev.textFields,
        { label: newLabel.trim(), key: generateKey(newLabel.trim()), required: newRequired, fixed: false, fieldType: newFieldType },
      ],
    }));
    markDirty();
    setShowAddModal(false);
  };

  const deleteField = (index: number) => {
    setForm({ ...form, textFields: form.textFields.filter((_: any, i: number) => i !== index) });
    markDirty();
  };

  const handleSave = async () => {
    if (startInput && endInput && new Date(startInput) >= new Date(endInput)) {
      setDateError("Kapanış tarihi açılış tarihinden sonra olmalıdır.");
      return;
    }
    setDateError("");
    setSaving(true);
    setSaveResult(null);
    try {
      await api.put("/form", {
        textFields: form.textFields,
        description: form.description,
        startDate: toUTC(startInput),
        endDate: toUTC(endInput),
        uniqueField: form.uniqueField || null,
      });
      await fetchForm();
      setSaveResult("success");
    } catch {
      setSaveResult("error");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDates = async () => {
    setShowClearConfirm(false);
    setClearError("");
    setSaving(true);
    try {
      await api.put("/form", {
        textFields: form.textFields,
        description: form.description,
        startDate: null,
        endDate: null,
        uniqueField: form.uniqueField || null,
      });
      setStartInput("");
      setEndInput("");
      await fetchForm();
      setSaveResult("success");
    } catch {
      setClearError("Tarihler temizlenirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;
  if (!loaded)    return <div className="p-6 text-gray-400">Yükleniyor...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">

      {/* ── Başlık ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Form Ayarları</h1>
          <p className="text-sm text-gray-400 mt-0.5">Başvuru formu içeriği ve tarihleri</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {isOpen ? "Form Açık" : "Form Kapalı"}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-1.5 rounded-lg font-medium text-sm transition
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isDirty
              ? "bg-gray-900 text-white hover:bg-black"
              : "bg-gray-100 text-gray-400 cursor-default"
            }`}
          >
            {saving ? "Kaydediliyor..." : isDirty ? "Kaydet" : "Kaydedildi"}
          </button>
        </div>
      </div>

      {/* ── Kaydet sonuç mesajları ────────────────────────────────── */}
      {saveResult === "success" && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 mb-5">
          <span>Değişiklikler kaydedildi.</span>
          <button onClick={() => setSaveResult(null)} className="text-green-400 hover:text-green-600">✕</button>
        </div>
      )}
      {saveResult === "error" && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 mb-5">
          <span>Kayıt sırasında hata oluştu. Tekrar deneyin.</span>
          <button onClick={() => setSaveResult(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {!saveResult && <div className="mb-4" />}

      {/* ── Açıklama ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-1.5">Açıklama</label>
        <textarea
          value={form.description || ""}
          rows={3}
          onChange={(e) => { setForm({ ...form, description: e.target.value }); markDirty(); }}
          placeholder="Öğrencilere gösterilecek form açıklaması..."
          className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none
          focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-700
          placeholder:text-gray-300"
        />
      </div>

      {/* ── Tarih ────────────────────────────────────────────────── */}
      <div className="border rounded-xl p-4 mb-6 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Başvuru Tarihi</h2>
          {(startInput || endInput) && !showClearConfirm && (
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={saving}
              className="text-xs text-red-400 hover:text-red-600 transition"
            >
              Tarihleri temizle
            </button>
          )}
        </div>

        {/* Tarih inputları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Açılış</label>
            <input
              type="datetime-local"
              value={startInput}
              onChange={(e) => { setStartInput(e.target.value); markDirty(); setDateError(""); }}
              className="w-full border rounded-lg p-2 text-sm bg-white
              focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Kapanış</label>
            <input
              type="datetime-local"
              value={endInput}
              onChange={(e) => { setEndInput(e.target.value); markDirty(); setDateError(""); }}
              className="w-full border rounded-lg p-2 text-sm bg-white
              focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Tarih doğrulama hatası */}
        {dateError && (
          <p className="text-xs text-red-500 mb-2">{dateError}</p>
        )}

        {/* Özet */}
        {(startInput || endInput) && !dateError && (
          <p className="text-xs text-gray-400">
            {startInput ? new Date(startInput).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—"}
            {" → "}
            {endInput ? new Date(endInput).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—"}
          </p>
        )}

        {!startInput && !endInput && (
          <p className="text-xs text-gray-400">Tarih girilmediği sürece form kapalı kalır.</p>
        )}

        {/* Inline temizle onayı */}
        {showClearConfirm && (
          <div className="mt-3 p-3 bg-white border border-red-100 rounded-lg space-y-2">
            <p className="text-xs text-gray-600">
              Tarih ayarları silinecek ve form kapalı kalacak. Devam edilsin mi?
            </p>
            {clearError && <p className="text-xs text-red-500">{clearError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleClearDates}
                disabled={saving}
                className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg
                hover:bg-red-600 transition disabled:opacity-50"
              >
                Evet, Temizle
              </button>
              <button
                onClick={() => { setShowClearConfirm(false); setClearError(""); }}
                className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Form Alanları ─────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Form Alanları</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.textFields.length} alan
              {form.textFields.some((f: any) => f.fixed) && (
                <span className="ml-1">· sabit alanlar düzenlenemez</span>
              )}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black transition"
          >
            + Alan Ekle
          </button>
        </div>

        {form.textFields.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-300 border border-dashed rounded-xl">
            Henüz alan eklenmedi.
          </div>
        ) : (
          <div className="space-y-2">
            {form.textFields.map((f: any, i: number) => (
              <div
                key={i}
                className={`border rounded-xl p-4 ${
                  f.fixed ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="flex gap-2 items-center mb-3">
                  <div className="flex-1">
                    <input
                      placeholder="Alan adı (örn: Ad Soyad)"
                      value={f.label}
                      disabled={f.fixed}
                      onChange={(e) => {
                        updateField(i, "label", e.target.value);
                        updateField(i, "key", generateKey(e.target.value));
                      }}
                      className="w-full border rounded-lg px-3 py-2 text-sm
                      disabled:bg-transparent disabled:text-gray-500 disabled:cursor-default
                      focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.fixed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium">
                        Sabit
                      </span>
                    )}
                    {!f.fixed && (
                      <button
                        onClick={() => deleteField(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                        text-gray-300 hover:text-red-500 hover:bg-red-50 transition text-lg leading-none"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={f.required}
                      disabled={f.fixed}
                      onChange={(e) => updateField(i, "required", e.target.checked)}
                      className="accent-gray-900"
                    />
                    Zorunlu alan
                  </label>
                  {!f.fixed && (
                    <select
                      value={f.fieldType || "text"}
                      onChange={(e) => { updateField(i, "fieldType", e.target.value); }}
                      className="text-xs border rounded-lg px-2 py-1 bg-white
                      focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-500"
                    >
                      <option value="text">Metin</option>
                      <option value="email">E-posta</option>
                      <option value="phone">Telefon</option>
                      <option value="number">Sayı</option>
                    </select>
                  )}
                  {f.fixed && f.fieldType && f.fieldType !== "text" && (
                    <span className="text-xs text-gray-400">{
                      f.fieldType === "email" ? "E-posta" :
                      f.fieldType === "phone" ? "Telefon" :
                      f.fieldType === "number" ? "Sayı" : "Metin"
                    }</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tekrar Başvuru Engeli ─────────────────────────────────── */}
      {form.textFields.length > 0 && (
        <div className="border rounded-xl p-4 mb-6 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Tekrar Başvuru Engeli</h2>
          <p className="text-xs text-gray-400 mb-3">
            Seçilen alan aynı değerle ikinci kez başvuruyu engeller.
          </p>
          <select
            value={form.uniqueField || ""}
            onChange={(e) => {
              setForm({ ...form, uniqueField: e.target.value || null });
              markDirty();
            }}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white
            focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-700"
          >
            <option value="">Kontrol yapma</option>
            {form.textFields.map((f: any) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
          {form.uniqueField && (
            <p className="text-xs text-blue-600 mt-2">
              Aynı <span className="font-medium">
                {form.textFields.find((f: any) => f.key === form.uniqueField)?.label || form.uniqueField}
              </span> değeriyle ikinci başvuru reddedilecek.
            </p>
          )}
        </div>
      )}

      {/* ── Alan Ekle Modal ──────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-lg p-5 sm:p-6 w-full sm:w-80 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Yeni Alan Ekle</h2>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Alan Adı</label>
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmAddField()}
                placeholder="örn: Ad Soyad"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none
                focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Alan Tipi</label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white
                focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-700"
              >
                <option value="text">Metin</option>
                <option value="email">E-posta</option>
                <option value="phone">Telefon</option>
                <option value="number">Sayı</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="accent-gray-900"
              />
              Zorunlu alan
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmAddField}
                disabled={!newLabel.trim()}
                className="flex-1 py-2 bg-gray-900 text-white text-sm rounded-lg
                hover:bg-black transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 border text-sm rounded-lg text-gray-600
                hover:bg-gray-50 transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FormSettingsPage;
