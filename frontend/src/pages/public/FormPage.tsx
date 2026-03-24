import { useEffect, useState } from "react";
import api from "../../services/api";
import type { Field, FormConfig } from "../../types";

function FormPage() {
  const [form, setForm] = useState<FormConfig | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

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
    if (form) {
      for (const field of form.textFields) {
        if (!formData[field.key]?.trim()) {
          setError(`"${field.label}" alanı boş bırakılamaz.`);
          return;
        }
      }
    }

    setError("");

    try {
      await api.post("/students/submit", {
        formData, // text alanları
        preferences: teachers.map((t) => t._id), // sıralı hoca ID'leri
      });

      console.log("Form gönderildi!");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-8">
        {/* Başlık */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium text-[#044074]">
            BİTİRME PROJESİ DANIŞMAN SEÇİMİ
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Lütfen tüm alanları eksiksiz doldurunuz.
          </p>
        </div>

        {/* Text Alanları */}
        <div className="space-y-4 mb-8">
          {form.textFields.map((field: Field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <input
                type="text"
                placeholder={`${field.label} giriniz`}
                value={formData[field.key] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#044074]/30 focus:border-[#044074] transition"
              />
            </div>
          ))}
        </div>

        {/* Hoca Sıralama */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            Hoca Tercihleri
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Oklara tıklayarak hocaları tercih sıranıza göre düzenleyiniz.
          </p>

          <div className="space-y-2">
            {teachers.map((teacher, index) => (
              <div
                key={teacher._id}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              >
                {/* Sıra numarası */}
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#044074] text-white text-xs font-bold shrink-0">
                  {index + 1}
                </span>

                {/* İsim */}
                <span className="flex-1 text-sm font-medium text-gray-800">
                  {teacher.name}
                </span>

                {/* Ok butonları */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed transition"
                  >
                    <svg
                      className="w-4 h-4 text-[#044074]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === teachers.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed transition"
                  >
                    <svg
                      className="w-4 h-4 text-[#044074]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4">
            <svg
              className="w-4 h-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 001.5 0v-4a.75.75 0 00-1.5 0v4zm.75-7a1 1 0 100 2 1 1 0 000-2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg bg-[#044074] hover:bg-[#033260] active:scale-95 text-white font-semibold text-sm transition-all duration-150"
        >
          Formu Gönder
        </button>
      </div>
    </div>
  );
}

export default FormPage;
