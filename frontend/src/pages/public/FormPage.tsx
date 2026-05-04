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

  const handleSubmit = async () => {
    if (isSubmitting) return;

    for (const field of form.textFields) {
      if (field.required && !formData[field.key]?.trim()) {
        setError(`"${field.label}" alanı boş bırakılamaz.`);
        return;
      }
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
          <h2 className="text-2xl font-bold text-[#044074] mb-2">
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
      <div className="w-full max-w-md bg-white rounded-xl border shadow-sm p-6 sm:p-8">
        
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
              </label>

              <input
                type="text"
                value={formData[field.key] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
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

                <div className="flex gap-2">
                  <button onClick={() => moveUp(index)}>↑</button>
                  <button onClick={() => moveDown(index)}>↓</button>
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