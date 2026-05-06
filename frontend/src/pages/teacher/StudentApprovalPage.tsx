import { useEffect, useState } from "react";
import api from "../../services/api";

interface PageData {
  students: any[];
  approvedStudents: any[];
  teacher: any;
  finalizedCount: number;
  totalTeachers: number;
}

const StudentApprovalPage = () => {
  const [data, setData] = useState<PageData | null>(null);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");

  const fetchData = async () => {
    try {
      const [myRes, formRes] = await Promise.all([
        api.get("/teachers/my-students"),
        api.get("/form"),
      ]);
      const d: PageData = myRes.data;
      setData(d);
      setFormConfig(formRes.data);
      if (d.teacher.hasFinalized) {
        setSelectedIds(new Set((d.approvedStudents || []).map((s: any) => s._id)));
      }
    } catch {
      setFetchError("Veriler yüklenemedi.");
    }
  };

  useEffect(() => { document.title = "Öğrenci Onay Listesi"; }, []);
  useEffect(() => { fetchData(); }, []);

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;
  if (!data || !formConfig) return <div className="p-6 text-gray-400">Yükleniyor...</div>;

  const { teacher, finalizedCount, totalTeachers } = data;
  const columns: any[] = formConfig.textFields || [];

  const allStudents = [
    ...(data.approvedStudents || []),
    ...(data.students || []),
  ];

  const selectionLimit = teacher.hasFinalized
    ? teacher.maxQuota
    : teacher.maxQuota - teacher.currentCount;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < selectionLimit) {
        next.add(id);
      }
      return next;
    });
  };

  const handleFinalize = async () => {
    setShowConfirm(false);
    setFinalizeError("");
    setLoading(true);
    try {
      const res = await api.post("/teachers/finalize", {
        approvedStudentIds: Array.from(selectedIds),
      });
      setResultMsg(res.data.message);
      await fetchData();
    } catch (err: any) {
      setFinalizeError(err.response?.data?.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const isDone = finalizedCount === totalTeachers;

  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Öğrenci Onay Listesi</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{teacher.name}</p>

      {/* Onay ilerleme çubuğu */}
      <div className="mb-5 p-3 bg-gray-50 dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl flex items-center gap-3 text-sm">
        <div className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
          <div
            className="bg-gray-700 dark:bg-white h-2 rounded-full transition-all"
            style={{ width: `${totalTeachers > 0 ? (finalizedCount / totalTeachers) * 100 : 0}%` }}
          />
        </div>
        <span className="text-gray-600 dark:text-zinc-300 whitespace-nowrap">
          {finalizedCount}/{totalTeachers} hoca onayladı
        </span>
      </div>

      {/* Otomatik atama tarihi */}
      {formConfig?.cascadeDate && !formConfig?.cascadeExecuted && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl text-xs text-orange-700 dark:text-orange-300">
          Son tarih:{" "}
          <span className="font-medium">
            {new Date(formConfig.cascadeDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
          </span>
          {" "}— Bu tarihe kadar seçimlerinizi tamamlayınız.
        </div>
      )}
      {formConfig?.cascadeExecuted && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-xs text-green-700 dark:text-green-400">
          Otomatik atama tamamlandı.
        </div>
      )}

      {/* Onay durumu banner */}
      {teacher.hasFinalized && (
        <div className={`mb-4 p-3 rounded-xl border text-sm ${
          isDone
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
        }`}>
          {isDone
            ? "Tüm hocalar onayladı. Admin otomatik atamayı başlatacak."
            : "Onayınız alındı. Admin tüm hocalar onayladıktan sonra atamayı başlatacak."}
          {" "}
          <span className="font-medium">Seçimleri aşağıdan güncelleyebilirsiniz.</span>
        </div>
      )}

      {resultMsg && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 text-sm flex items-center justify-between">
          <span>{resultMsg}</span>
          <button onClick={() => setResultMsg("")} className="text-blue-400 hover:text-blue-600 ml-3">✕</button>
        </div>
      )}

      {finalizeError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{finalizeError}</span>
          <button onClick={() => setFinalizeError("")} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* Kontenjan bilgisi */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: "Toplam",       value: allStudents.length },
          { label: "Seçili",       value: selectedIds.size, highlight: true },
          { label: "Kalan Limit",  value: selectionLimit - selectedIds.size, red: selectionLimit - selectedIds.size === 0 },
          { label: "Maks",         value: teacher.maxQuota },
        ].map(({ label, value, highlight, red }) => (
          <div key={label} className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm">
            <span className="text-gray-400">{label}: </span>
            <span className={`font-semibold ${highlight ? "text-blue-600" : red ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {selectionLimit === 0 && allStudents.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm">
          Kontenjanınız dolmuş. Tüm öğrenciler otomatik atama bekleyecek.
        </div>
      )}

      {allStudents.length === 0 && (
        <div className="text-gray-400 text-sm py-10 text-center bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-lg">
          1. tercih listenizdeki öğrenci yok.
        </div>
      )}

      {/* Öğrenci tablosu */}
      {allStudents.length > 0 && (
        <>
          <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-lg overflow-x-auto mb-4">
           <div className="min-w-max">
            <div
              className="grid bg-gray-100 dark:bg-zinc-900 text-xs font-semibold p-3 text-gray-500 dark:text-gray-400"
              style={{ gridTemplateColumns: `40px repeat(${columns.length + 1}, minmax(140px,1fr))` }}
            >
              <div />
              {columns.map((col: any) => <div key={col.key}>{col.label}</div>)}
              <div>Tercih Sırası</div>
            </div>

            {allStudents.map((s) => {
              const isSelected = selectedIds.has(s._id);
              const isDisabled = !isSelected && selectedIds.size >= selectionLimit;

              return (
                <div
                  key={s._id}
                  onClick={() => { if (!isDisabled) toggleSelect(s._id); }}
                  className={`grid items-center p-3 border-t dark:border-zinc-800 text-sm cursor-pointer transition-colors
                    ${isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-400"
                      : isDisabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-gray-50 dark:hover:bg-zinc-900"
                    }`}
                  style={{ gridTemplateColumns: `40px repeat(${columns.length + 1}, minmax(140px,1fr))` }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    readOnly
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer w-4 h-4"
                  />
                  {columns.map((col: any) => (
                    <div key={col.key} className="text-gray-700 dark:text-white">
                      {s.formData?.[col.key] || "-"}
                    </div>
                  ))}
                  <div className="text-xs text-gray-400 space-y-0.5">
                    {s.preferences.map((p: any, i: number) => (
                      <div key={i}>{i + 1}. {p.name}</div>
                    ))}
                  </div>
                </div>
              );
            })}
           </div>
          </div>

          {/* Onay / güncelleme bölümü */}
          {showConfirm ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl space-y-3">
              <p className="text-sm text-gray-700 dark:text-white">
                <span className="font-semibold">{selectedIds.size} öğrenci</span> onaylanacak.
                {allStudents.length - selectedIds.size > 0 && (
                  <> <span className="font-semibold">{allStudents.length - selectedIds.size} öğrenci</span> onaylanmayacak — atama bekleyecek.</>
                )}
              </p>
              {teacher.hasFinalized && (
                <p className="text-xs text-orange-600 dark:text-orange-400">Önceki seçimler sıfırlanıp yeniden uygulanacak.</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFinalize}
                  disabled={loading}
                  className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium
                  hover:bg-black dark:hover:bg-zinc-100 transition disabled:opacity-50"
                >
                  {loading ? "İşleniyor..." : "Evet, Onayla"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-5 py-2 border dark:border-zinc-700 rounded-lg text-sm text-gray-600 dark:text-zinc-300
                  hover:bg-white dark:hover:bg-zinc-900 transition"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium
                hover:bg-black dark:hover:bg-zinc-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {teacher.hasFinalized ? "Seçimleri Güncelle" : "Onayla ve Tamamla"}
              </button>
              <p className="text-xs text-gray-400">
                {teacher.hasFinalized
                  ? "Admin atamayı başlatana kadar değiştirebilirsiniz."
                  : "Onaylanmayan öğrenciler, admin atamayı başlattığında otomatik atanır."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentApprovalPage;
