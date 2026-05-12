import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import type { Field, FormConfig } from "../../types";
import { useTheme } from "../../ThemeContext";
import { SkeletonField, SkeletonLine, SkeletonPreferenceItem } from "../components/Skeleton";
import AuthGate from "../../components/AuthGate";
import { toast } from "sonner";

function FormPageContent() {
  const [form, setForm] = useState<FormConfig | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => { document.title = "Bitirme Projesi Danışman Seçimi"; }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formRes, teacherRes, myRes] = await Promise.all([
          api.get("/form"),
          api.get("/teachers"),
          api.get("/students/me").catch(() => ({ data: { student: null } })),
        ]);

        setForm(formRes.data);
        const allTeachers: any[] = teacherRes.data;
        const existingStudent = myRes.data.student;

        if (existingStudent?.formData && Object.keys(existingStudent.formData).length > 0) {
          setFormData(existingStudent.formData);
          setHasExistingSubmission(true);
          if (existingStudent.preferences?.length > 0) {
            const prefIds: string[] = existingStudent.preferences.map((p: any) => p._id || p);
            const ordered = [
              ...prefIds.map((id) => allTeachers.find((t) => t._id === id)).filter(Boolean),
              ...allTeachers.filter((t) => !prefIds.includes(t._id)),
            ];
            setTeachers(ordered);
          } else {
            setTeachers(allTeachers);
          }
        } else {
          setTeachers(allTeachers);
        }
      } catch {
        setError("Veriler yüklenemedi. Lütfen sayfayı yenileyin.");
      }
    };
    fetchData();
  }, []);

  const ThemeBtn = () => (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors
        bg-gray-900 text-white dark:bg-white dark:text-black z-50"
      title={theme === "dark" ? "Aydınlık tema" : "Karanlık tema"}
    >
      ☾
    </button>
  );

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-10">
        <ThemeBtn />
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-xl border dark:border-zinc-800 shadow-sm p-5 sm:p-8 space-y-6">
            <div className="space-y-2">
              <SkeletonLine className="w-2/5 h-5" />
              <SkeletonLine className="w-3/5 h-3" />
            </div>
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonField key={i} />)}
            </div>
            <div className="space-y-2">
              <SkeletonLine className="w-1/3 h-4" />
              {Array.from({ length: 4 }).map((_, i) => <SkeletonPreferenceItem key={i} />)}
            </div>
            <SkeletonLine className="w-full h-11 rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  const now = new Date();
  const start = form.startDate ? new Date(form.startDate) : null;
  const end = form.endDate ? new Date(form.endDate) : null;

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragNode.current = e.currentTarget;
    setDragIndex(index);
    // sürükleme görselini küçük gecikmeyle uygula
    setTimeout(() => setDragIndex(index), 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...teachers];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, dragged);
    setTeachers(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const validateFields = (): string => {
    for (const field of form.textFields) {
      const value = (formData[field.key] || "").trim();
      if (field.required && !value) return `"${field.label}" alanı boş bırakılamaz.`;
      if (value) {
        if (field.fieldType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return `"${field.label}" geçerli bir e-posta adresi olmalıdır.`;
        if (field.fieldType === "phone") {
          const digits = value.replace(/\D/g, "");
          if (value.trim().startsWith("0")) {
            if (digits.length !== 11 || !digits.startsWith("05"))
              return `"${field.label}" 05XX XXX XX XX formatında 11 haneli olmalıdır.`;
          } else if (value.trim().startsWith("+")) {
            if (digits.length < 7 || digits.length > 15)
              return `"${field.label}" geçerli bir uluslararası numara giriniz (+XX ile başlayan).`;
          } else {
            return `"${field.label}" 05XX... veya +ülkekodu... formatında girilmelidir.`;
          }
        }
        if (field.key === "gpa") {
          if (!/^\d(\.\d{1,2})?$/.test(value))
            return `"${field.label}" geçerli bir not ortalaması giriniz (örn: 3.5 veya 3.50).`;
          const num = parseFloat(value);
          if (num < 0 || num > 4)
            return `"${field.label}" 0 ile 4 arasında olmalıdır.`;
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

      if (hasExistingSubmission) {
        toast.success("Tercihleriniz güncellendi.");
      } else {
        setSubmitted(true);
      }
      setHasExistingSubmission(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg || "Bir hata oluştu.");
    }
  };

  // SUBMITTED
  if (submitted)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <ThemeBtn />
        <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-2xl shadow-lg border dark:border-zinc-800 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Form Gönderildi!
          </h2>
          <p className="text-sm text-gray-400">
            Formunuz başarıyla alınmıştır.
          </p>
        </div>
      </div>
    );

  // FORM KAPALI
  if (!isFormOpen)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-zinc-950 px-4">
        <ThemeBtn />
        <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 shadow-xl rounded-2xl p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
            Form Kapalı
          </h2>

          {start && now < start && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Açılış:{" "}
              <span className="font-medium text-gray-700 dark:text-white">
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

  // NORMAL FORM
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-10">
      <ThemeBtn />
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-xl border dark:border-zinc-800 shadow-sm p-5 sm:p-8">

        <div className="flex justify-center mb-6">
          <img src="/kirmizi-logo.png" alt="Logo" className="h-16 object-contain" />
        </div>

        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Danışman Seçimi
          </h1>

          {form.description && (
            <p className="text-sm text-gray-400 mt-1">
              {form.description}
            </p>
          )}

          {end && (
            <p className="text-sm text-red-500 mt-2 font-medium">
              Son Tarih: {end.toLocaleString("tr-TR")}
            </p>
          )}
        </div>

        <div className="space-y-5 mb-8">
          {form.textFields.map((field: Field) => (
            <div key={field.key}>
              <label className="text-sm text-gray-500 dark:text-gray-400">
                {field.label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>

              <input
                type={field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : "text"}
                inputMode={
                  field.key === "gpa" ? "decimal" :
                  field.fieldType === "phone" ? "tel" :
                  field.fieldType === "number" ? "numeric" :
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
                    const stripped = val.replace(/[^\d\s\-+]/g, "");
                    if (stripped.startsWith("0")) {
                      const raw = stripped.replace(/\D/g, "").slice(0, 11);
                      if (raw.length <= 4) val = raw;
                      else if (raw.length <= 7) val = raw.slice(0, 4) + " " + raw.slice(4);
                      else if (raw.length <= 9) val = raw.slice(0, 4) + " " + raw.slice(4, 7) + " " + raw.slice(7);
                      else val = raw.slice(0, 4) + " " + raw.slice(4, 7) + " " + raw.slice(7, 9) + " " + raw.slice(9);
                    } else {
                      const digits = stripped.replace(/\D/g, "");
                      if (digits.length > 15) return;
                      val = stripped;
                    }
                  } else if (field.fieldType === "number") {
                    val = val.replace(/\D/g, "");
                  }
                  setFormData((prev) => ({ ...prev, [field.key]: val }));
                  if (error) setError("");
                }}
                placeholder={
                  field.key === "gpa" ? "örn: 2.40" :
                  field.fieldType === "email" ? "ornek@mail.com" :
                  field.fieldType === "phone" ? "0532 123 45 67 veya +49..." :
                  field.fieldType === "number" ? "Yalnızca rakam" :
                  ""
                }
                className="w-full mt-1 border-b dark:border-zinc-700 py-2 text-sm bg-transparent
                text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-zinc-600
                focus:outline-none focus:border-gray-900 dark:focus:border-white"
              />
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 dark:text-white mb-1">
            Tercih Sıralaması
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">
            Hocaları sürükleyerek veya ok tuşlarıyla istediğiniz sıraya göre düzenleyebilirsiniz.
          </p>

          <div className="space-y-2">
            {teachers.map((teacher, index) => (
              <div
                key={teacher._id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={[
                  "flex justify-between border rounded-md p-2 transition-all select-none",
                  dragIndex === index
                    ? "opacity-40 scale-[0.98] border-dashed dark:border-zinc-600 border-gray-300"
                    : dragOverIndex === index
                    ? "border-gray-500 dark:border-zinc-400 bg-gray-50 dark:bg-zinc-900"
                    : "border-gray-200 dark:border-zinc-800",
                ].join(" ")}
              >
                {/* Sürükleme tutacağı + numara + isim */}
                <div className="flex gap-2 items-start min-w-0">
                  <span
                    className="mt-1 text-gray-300 dark:text-zinc-600 cursor-grab active:cursor-grabbing text-base leading-none shrink-0"
                    title="Sürükle"
                  >
                    ⠿
                  </span>
                  <span className="text-gray-400 mt-0.5 shrink-0">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="text-gray-800 dark:text-white text-sm">{teacher.name}</p>
                    {teacher.bio && (
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                        {teacher.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ok butonları */}
                <div className="flex gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="w-9 h-9 flex items-center justify-center border dark:border-zinc-700 rounded-lg
                    text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900
                    disabled:opacity-25 disabled:cursor-not-allowed transition active:scale-95"
                  >↑</button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === teachers.length - 1}
                    className="w-9 h-9 flex items-center justify-center border dark:border-zinc-700 rounded-lg
                    text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900
                    disabled:opacity-25 disabled:cursor-not-allowed transition active:scale-95"
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
          className="w-full py-3 text-white bg-gray-900 dark:bg-white dark:text-black
          hover:bg-black dark:hover:bg-zinc-100 rounded-lg transition disabled:opacity-50"
        >
          {isSubmitting ? (hasExistingSubmission ? "Güncelleniyor..." : "Gönderiliyor...") : (hasExistingSubmission ? "Güncelle" : "Gönder")}
        </button>
      </div>
    </div>
  );
}

export default function FormPage() {
  return (
    <AuthGate>
      <FormPageContent />
    </AuthGate>
  );
}
