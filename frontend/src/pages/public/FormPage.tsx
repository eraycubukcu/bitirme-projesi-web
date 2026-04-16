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
      const formRes = await api.get("/form");
      const teacherRes = await api.get("/teachers");
      setForm(formRes.data);
      setTeachers(teacherRes.data);
    };
    fetchData();
  }, []);

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

    if (form) {
      for (const field of form.textFields) {
        if (!formData[field.key]?.trim()) {
          setError(`"${field.label}" alanı boş bırakılamaz.`);
          return;
        }
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

  if (!form)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p>
      </div>
    );

  const now = new Date();
  const start = form.startDate ? new Date(form.startDate) : null;
  const end = form.endDate ? new Date(form.endDate) : null;

  const isFormOpen = (!start || now >= start) && (!end || now <= end);

  if (submitted)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#044074] mb-2">
            Form Gönderildi!
          </h2>
          <p className="text-sm text-gray-400">
            Formunuz başarıyla alınmıştır. Sayfayı kapatabilirsiniz.
          </p>
        </div>
      </div>
    );

  if (!isFormOpen)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Form Kapalı
          </h2>

          {start && now < start && (
            <p className="text-sm text-gray-500">
              Başlangıç:{" "}
              <span className="font-medium text-gray-700">
                {start.toLocaleString()}
              </span>
            </p>
          )}

          {end && now > end && (
            <p className="text-sm text-gray-500">Bu formun süresi doldu.</p>
          )}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Danışman Seçimi
          </h1>
          {form.description && (
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {form.description}
            </p>
          )}
          {form.endDate && (
            <p className="text-xs sm:text-sm text-red-500 mt-1 font-medium">
              Son Tarih:{" "}
              {new Date(form.endDate).toLocaleString("tr-TR")}
            </p>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-5 mb-8">
          {form.textFields.map((field: Field) => (
            <div key={field.key}>
              <label className="text-xs sm:text-sm text-gray-500">
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
                className="w-full mt-1 border-b border-gray-200 py-2 text-sm
                focus:outline-none focus:border-gray-900 transition"
              />
            </div>
          ))}
        </div>

        {/* Hoca sıralama */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Tercih Sıralaması
          </h2>
          <div className="space-y-2">
            {teachers.map((teacher, index) => (
              <div
                key={teacher._id}
                className="flex items-center justify-between border py-2 px-2 rounded-md hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-4">{index + 1}</span>

                  <span className="text-sm text-gray-800">{teacher.name}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-800 disabled:opacity-20 text-xl"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === teachers.length - 1}
                    className="text-gray-400 hover:text-gray-800 disabled:opacity-20 text-xl"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs sm:text-sm text-red-500 mb-4">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 text-sm font-medium text-white bg-gray-900
          hover:bg-black active:scale-[0.98] transition rounded-lg"
        >
          {isSubmitting ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </div>
  );
}

export default FormPage;
