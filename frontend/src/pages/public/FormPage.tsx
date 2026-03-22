import { useEffect, useState } from "react";
import api from "../../services/api";
import type { Field, FormConfig } from "../../types";

function FormPage() {
  const [form, setForm] = useState<FormConfig | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const formRes = await api.get("/form");
        const teacherRes = await api.get("/teachers");

        setForm(formRes.data);
        setTeachers(teacherRes.data);

        // preference array oluştur (hoca sayısı kadar)
        setPreferences(new Array(teacherRes.data.length).fill(""));
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePreferenceChange = (index: number, value: string) => {
    const newPrefs = [...preferences];
    newPrefs[index] = value;
    setPreferences(newPrefs);
  };

  const handleSubmit = () => {
    console.log("FORM DATA:", formData);
    console.log("PREFERENCES:", preferences);
  };

  if (!form) {
    return <div className="p-10">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Form
        </h1>

        {/* TEXT INPUTLAR */}
        {form.textFields.map((field: Field) => (
          <div key={field.key} className="mb-4">
            <label className="block mb-1 font-medium">
              {field.label}
            </label>
            <input
              className="border p-2 w-full rounded"
              placeholder={field.label}
              value={formData[field.key] || ""}
              onChange={(e) =>
                handleChange(field.key, e.target.value)
              }
            />
          </div>
        ))}

        {/* HOCA SIRALAMA */}
        <h2 className="mt-6 mb-2 font-bold">
          Hoca Sıralama
        </h2>

        {teachers.map((_, index) => (
          <select
            key={index}
            className="border p-2 w-full mb-2 rounded"
            value={preferences[index]}
            onChange={(e) =>
              handlePreferenceChange(index, e.target.value)
            }
          >
            <option value="">Seçiniz</option>

            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name}
              </option>
            ))}
          </select>
        ))}

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white py-2 rounded mt-4 hover:bg-blue-600"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}

export default FormPage;