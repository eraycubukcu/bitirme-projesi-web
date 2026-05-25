import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { SkeletonBlock, SkeletonLine } from "../components/Skeleton";

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
  const [cascadeInput, setCascadeInput] = useState("");

  const fetchForm = async () => {
    try {
      const res = await api.get("/form");
      const data = res.data;
      setForm(data);
      setStartInput(toLocalInput(data.startDate || ""));
      setEndInput(toLocalInput(data.endDate || ""));
      setCascadeInput(toLocalInput(data.cascadeDate || ""));
      setIsDirty(false);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setFetchError("Form ayarları yüklenemedi.");
      }
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { document.title = "Form Ayarları"; }, []);
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
    if (cascadeInput && startInput && new Date(cascadeInput) < new Date(startInput)) {
      setDateError("Otomatik atama tarihi form açılış tarihinden önce olamaz.");
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
        cascadeDate: toUTC(cascadeInput),
      });
      await fetchForm();
      setSaveResult("success");
      toast.success("Form ayarları kaydedildi.");
    } catch {
      setSaveResult("error");
      toast.error("Kaydedilemedi. Lütfen tekrar deneyin.");
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
        cascadeDate: toUTC(cascadeInput),
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

  if (!loaded) return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="w-40 h-6" />
        <SkeletonLine className="w-56 h-3" />
      </div>
      <div className="border dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <SkeletonLine className="w-32 h-4" />
        <SkeletonBlock className="w-full h-20 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonBlock className="h-10 rounded-lg" />
          <SkeletonBlock className="h-10 rounded-lg" />
        </div>
      </div>
      <div className="border dark:border-zinc-800 rounded-xl p-5 space-y-3">
        <SkeletonLine className="w-32 h-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border dark:border-zinc-800 rounded-lg p-3">
            <SkeletonLine className="w-32 h-3" />
            <SkeletonBlock className="w-16 h-7 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  const dtCls = "w-full border dark:border-zinc-800 rounded-lg p-2 text-sm " +
    "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white " +
    "focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white";

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">

      {/* ── Başlık ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Form Ayarları</h1>
          <p className="text-sm text-gray-400 mt-0.5">Başvuru formu içeriği ve tarihleri</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isOpen
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400"
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
              ? "bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-100"
              : "bg-gray-100 dark:bg-zinc-900 text-gray-400 dark:text-gray-500 cursor-default"
            }`}
          >
            {saving ? "Kaydediliyor..." : isDirty ? "Kaydet" : "Kaydedildi"}
          </button>
        </div>
      </div>

      {/* ── Kaydet sonuç ───────────────────────────────────────── */}
      {saveResult === "success" && (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-xs text-green-700 dark:text-green-400 mb-5">
          <span>Değişiklikler kaydedildi.</span>
          <button onClick={() => setSaveResult(null)} className="text-green-400 hover:text-green-600">✕</button>
        </div>
      )}
      {saveResult === "error" && (
        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 mb-5">
          <span>Kayıt sırasında hata oluştu. Tekrar deneyin.</span>
          <button onClick={() => setSaveResult(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {!saveResult && <div className="mb-4" />}

      {/* ── Otomatik Atama Tarihi ──────────────────────────────── */}
      <div className="border dark:border-zinc-800 rounded-xl p-4 mb-6 bg-gray-50 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-white">Otomatik Atama Tarihi</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Bu tarih geldiğinde bekleyen öğrenciler otomatik olarak atanır.
            </p>
          </div>
          {cascadeInput && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              form.cascadeExecuted
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
            }`}>
              {form.cascadeExecuted ? "Tamamlandı" : "Bekliyor"}
            </span>
          )}
        </div>

        <input
          type="datetime-local"
          value={cascadeInput}
          onChange={(e) => { setCascadeInput(e.target.value); markDirty(); }}
          className={dtCls}
        />

        {cascadeInput ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {new Date(cascadeInput).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
            </p>
            <button
              onClick={() => { setCascadeInput(""); markDirty(); }}
              className="text-xs text-red-400 hover:text-red-600 transition"
            >
              Tarihi temizle
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1">
            Tarih girilmezse otomatik atama çalışmaz.
          </p>
        )}
      </div>

      {/* ── Açıklama ───────────────────────────────────────────── */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 dark:text-white block mb-1.5">Açıklama</label>
        <textarea
          value={form.description || ""}
          rows={3}
          onChange={(e) => { setForm({ ...form, description: e.target.value }); markDirty(); }}
          placeholder="Öğrencilere gösterilecek form açıklaması..."
          className="w-full border dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm resize-none
          bg-white dark:bg-zinc-900 text-gray-700 dark:text-white
          focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white
          placeholder:text-gray-300 dark:placeholder:text-zinc-600"
        />
      </div>

      {/* ── Tarih ──────────────────────────────────────────────── */}
      <div className="border dark:border-zinc-800 rounded-xl p-4 mb-6 bg-gray-50 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white">Başvuru Tarihi</h2>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Açılış</label>
            <input
              type="datetime-local"
              value={startInput}
              onChange={(e) => { setStartInput(e.target.value); markDirty(); setDateError(""); }}
              className={dtCls}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Kapanış</label>
            <input
              type="datetime-local"
              value={endInput}
              onChange={(e) => { setEndInput(e.target.value); markDirty(); setDateError(""); }}
              className={dtCls}
            />
          </div>
        </div>

        {dateError && (
          <p className="text-xs text-red-500 mb-2">{dateError}</p>
        )}

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

        {showClearConfirm && (
          <div className="mt-3 p-3 bg-white dark:bg-zinc-950 border border-red-100 dark:border-red-900 rounded-lg space-y-2">
            <p className="text-xs text-gray-600 dark:text-zinc-300">
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
                className="text-xs px-3 py-1.5 border dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Form Alanları ──────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-white">Form Alanları</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.textFields.length} alan
              {form.textFields.some((f: any) => f.fixed) && (
                <span className="ml-1">· sabit alanlar düzenlenemez</span>
              )}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="text-sm px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg
            hover:bg-black dark:hover:bg-zinc-100 transition"
          >
            + Alan Ekle
          </button>
        </div>

        {form.textFields.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-300 dark:text-zinc-700 border dark:border-zinc-800 border-dashed rounded-xl">
            Henüz alan eklenmedi.
          </div>
        ) : (
          <div className="space-y-2">
            {form.textFields.map((f: any, i: number) => (
              <div
                key={i}
                className={`border dark:border-zinc-800 rounded-xl p-4 ${
                  f.fixed
                    ? "bg-gray-50 dark:bg-zinc-900"
                    : "bg-white dark:bg-zinc-950"
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
                      className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm
                      bg-white dark:bg-zinc-900 text-gray-800 dark:text-white
                      disabled:bg-transparent disabled:text-gray-500 disabled:cursor-default
                      focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.fixed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 font-medium">
                        Sabit
                      </span>
                    )}
                    {!f.fixed && (
                      <button
                        onClick={() => deleteField(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                        text-gray-300 dark:text-zinc-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-lg leading-none"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={f.required}
                      disabled={f.fixed}
                      onChange={(e) => updateField(i, "required", e.target.checked)}
                      className="accent-gray-900 dark:accent-white"
                    />
                    Zorunlu alan
                  </label>
                  {!f.fixed && (
                    <select
                      value={f.fieldType || "text"}
                      onChange={(e) => { updateField(i, "fieldType", e.target.value); }}
                      className="text-xs border dark:border-zinc-700 rounded-lg px-2 py-1
                      bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400
                      focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
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

      {/* ── Alan Ekle Modal ────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-end sm:items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-t-2xl sm:rounded-xl shadow-lg p-5 sm:p-6 w-full sm:w-80 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Yeni Alan Ekle</h2>

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Alan Adı</label>
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmAddField()}
                placeholder="örn: Ad Soyad"
                className="w-full border dark:border-zinc-800 rounded-lg px-3 py-2 text-sm
                bg-white dark:bg-zinc-900 text-gray-900 dark:text-white
                focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Alan Tipi</label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="w-full border dark:border-zinc-800 rounded-lg px-3 py-2 text-sm
                bg-white dark:bg-zinc-900 text-gray-700 dark:text-white
                focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
              >
                <option value="text">Metin</option>
                <option value="email">E-posta</option>
                <option value="phone">Telefon</option>
                <option value="number">Sayı</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="accent-gray-900 dark:accent-white"
              />
              Zorunlu alan
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmAddField}
                disabled={!newLabel.trim()}
                className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-sm rounded-lg
                hover:bg-black dark:hover:bg-zinc-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 border dark:border-zinc-800 text-sm rounded-lg text-gray-600 dark:text-zinc-300
                hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
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
