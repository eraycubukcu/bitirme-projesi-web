import { useEffect, useState } from "react";
import api from "../../services/api";
import type { Field, FormConfig } from "../../types";

function FormPage() {
  const [form, setForm] = useState<FormConfig | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { document.title = "Bitirme Projesi Danışman Seçimi"; }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const formRes = await api.get("/form");
        const teacherRes = await api.get("/teachers");
        setForm(formRes.data);
        setTeachers(teacherRes.data);
      } catch {
        setError("Veriler yüklenemedi. Lütfen sayfayı yenileyin.");
      }
    };
    fetchData();
  }, []);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p>
        )}
      </div>
    );
  }

  const now = new Date();
  const start = form.startDate ? new Date(form.startDate) : null;
  const end = form.endDate ? new Date(form.endDate) : null;

  // Tarih girilmemişse form kapalı (backend ile aynı kural)
  const isFormOpen =
    !!(start || end) &&
    (!start || now >= start) &&
    (!end || now <= end);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...teachers];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setTeachers(updated);
  };

  const moveDown = (index: number) => {
    if (index === teachers.length - 1) return;
    const updated = [...teachers];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    setTeachers(updated);
  };

  const validateFields = (): string => {
    for (const field of form.textFields) {
      const value = (formData[field.key] || "").trim();
      if (field.required && !value) return `"${field.label}" alanı boş bırakılamaz.`;
      if (value) {
        if (field.fieldType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return `"${field.label}" geçerli bir e-posta adresi olmalıdır.`;
        if (field.fieldType === "phone") {
          const digits = value.replace(/[\s\-().+]/g, "");
          if (!/^\d+$/.test(digits) || digits.length < 7)
            return `"${field.label}" geçerli bir telefon numarası olmalıdır.`;
        }
        if (field.key === "gpa") {
          if (!/^\d\.\d{2}$/.test(value))
            return `"${field.label}" X.XX formatında girilmelidir (örn: 2.40).`;
          const num = parseFloat(value);
          if (num < 0 || num > 4)
            return `"${field.label}" 0.00 ile 4.00 arasında olmalıdır (örn: 2.40).`;
        } else if (field.fieldType === "number" && !/^\d+$/.test(value)) {
          return `"${field.label}" yalnızca rakam içermelidir.`;
        }
      }
    }
    return "";
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/students/submit", {
        formData,
        preferences: teachers.map((t) => t._id),
      });

      setSubmitted(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg || "Bir hata oluştu.");
    }
  };

  // ✅ SUBMITTED
  if (submitted)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Form Gönderildi!
          </h2>
          <p className="text-sm text-gray-400">
            Formunuz başarıyla alınmıştır.
          </p>
        </div>
      </div>
    );

  // 🔥 FORM KAPALI (EN SONDA)
  if (!isFormOpen)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="bg-white border shadow-xl rounded-2xl p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Form Kapalı
          </h2>

          {start && now < start && (
            <p className="text-sm text-gray-500">
              Açılış:{" "}
              <span className="font-medium text-gray-700">
                {start.toLocaleString("tr-TR")}
              </span>
            </p>
          )}

          {end && now > end && (
            <p className="text-sm text-red-500">
              Bu formun süresi doldu.
            </p>
          )}
        </div>
      </div>
    );

  // ✅ NORMAL FORM
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl border shadow-sm p-5 sm:p-8">
        
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">
            Danışman Seçimi
          </h1>

          {form.description && (
            <p className="text-sm text-gray-400 mt-1">
              {form.description}
            </p>
          )}

          {/* 🔥 SON TARİH HER ZAMAN GÖZÜKSÜN */}
          {end && (
            <p className="text-sm text-red-500 mt-2 font-medium">
              Son Tarih: {end.toLocaleString("tr-TR")}
            </p>
          )}
        </div>

        <div className="space-y-5 mb-8">
          {form.textFields.map((field: Field) => (
            <div key={field.key}>
              <label className="text-sm text-gray-500">
                {field.label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>

              <input
                type={field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : "text"}
                inputMode={
                  field.key === "gpa" ? "decimal" :
                  field.fieldType === "phone" || field.fieldType === "number" ? "numeric" :
                  undefined
                }
                value={formData[field.key] || ""}
                onChange={(e) => {
                  let val = e.target.value;
                  if (field.key === "gpa") {
                    val = val.replace(",", ".");
                    val = val.replace(/[^\d.]/g, "");
                    const dotIdx = val.indexOf(".");
                    if (dotIdx === -1) {
                      val = val.slice(0, 1);
                      if (val && parseInt(val) > 4) val = "4";
                    } else {
                      const intPart = val.slice(0, dotIdx).slice(0, 1);
                      const decPart = val.slice(dotIdx + 1).replace(/\./g, "").slice(0, 2);
                      const clampedInt = intPart && parseInt(intPart) > 4 ? "4" : intPart;
                      val = clampedInt + "." + decPart;
                    }
                    e.target.value = val;
                  } else if (field.fieldType === "phone") {
                    val = val.replace(/[^\d\s\-().+]/g, "");
                  } else if (field.fieldType === "number") {
                    val = val.replace(/\D/g, "");
                  }
                  setFormData((prev) => ({ ...prev, [field.key]: val }));
                  if (error) setError("");
                }}
                placeholder={
                  field.key === "gpa" ? "örn: 2.40" :
                  field.fieldType === "email" ? "ornek@mail.com" :
                  field.fieldType === "phone" ? "05xx xxx xx xx" :
                  field.fieldType === "number" ? "Yalnızca rakam" :
                  ""
                }
                className="w-full mt-1 border-b py-2 text-sm focus:outline-none focus:border-gray-900"
              />
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Tercih Sıralaması
          </h2>

          <div className="space-y-2">
            {teachers.map((teacher, index) => (
              <div
                key={teacher._id}
                className="flex justify-between border p-2 rounded-md"
              >
                <div className="flex gap-3">
                  <span className="text-gray-400">{index + 1}</span>
                  <span>{teacher.name}</span>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="w-9 h-9 flex items-center justify-center border rounded-lg text-gray-500
                    hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition active:scale-95"
                  >↑</button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === teachers.length - 1}
                    className="w-9 h-9 flex items-center justify-center border rounded-lg text-gray-500
                    hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition active:scale-95"
                  >↓</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 text-white bg-gray-900 rounded-lg"
        >
          {isSubmitting ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </div>
  );
}

export default FormPage;