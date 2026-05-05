import { useEffect, useState } from "react";
import api from "../../services/api";

interface PageData {
  students: any[];
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
      setData(myRes.data);
      setFormConfig(formRes.data);
    } catch {
      setFetchError("Veriler yüklenemedi.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;
  if (!data || !formConfig) return <div className="p-6 text-gray-400">Yükleniyor...</div>;

  const { students, teacher, finalizedCount, totalTeachers } = data;
  const remainingQuota = teacher.maxQuota - teacher.currentCount;
  const columns: any[] = formConfig.textFields || [];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < remainingQuota) {
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
      setSelectedIds(new Set());
      await fetchData();
    } catch (err: any) {
      setFinalizeError(err.response?.data?.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // ── Hoca zaten onayladı ───────────────────────────────────────────────────
  if (teacher.hasFinalized) {
    const isDone = finalizedCount === totalTeachers;
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-xl font-semibold mb-1">Öğrenci Onay Listesi</h1>
        <p className="text-sm text-gray-500 mb-6">{teacher.name}</p>

        <div
          className={`p-5 rounded-xl border ${
            isDone ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
          }`}
        >
          <p className={`font-semibold mb-1 ${isDone ? "text-green-700" : "text-blue-700"}`}>
            {isDone
              ? "Tüm hocalar onayladı. Otomatik atama gerçekleştirildi."
              : "Onayınız alındı."}
          </p>
          {!isDone && (
            <p className="text-sm text-blue-600">
              {finalizedCount}/{totalTeachers} hoca tamamladı. Diğer hocalar
              tamamladığında öğrenciler otomatik atanacak.
            </p>
          )}
        </div>

        {!isDone && (
          <button onClick={fetchData} className="mt-4 text-sm text-gray-500 underline">
            Durumu yenile
          </button>
        )}
      </div>
    );
  }

  // ── Onay bekliyor ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-1">Öğrenci Onay Listesi</h1>
      <p className="text-sm text-gray-500 mb-4">{teacher.name}</p>

      {/* Onay ilerleme çubuğu */}
      <div className="mb-5 p-3 bg-gray-50 border rounded-xl flex items-center gap-3 text-sm">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-gray-700 h-2 rounded-full transition-all"
            style={{ width: `${totalTeachers > 0 ? (finalizedCount / totalTeachers) * 100 : 0}%` }}
          />
        </div>
        <span className="text-gray-600 whitespace-nowrap">
          {finalizedCount}/{totalTeachers} hoca onayladı
        </span>
      </div>

      {/* Kontenjan bilgisi */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: "Bekleyen",         value: students.length },
          { label: "Seçili",           value: selectedIds.size, highlight: true },
          { label: "Kalan Kontenjan",  value: remainingQuota, red: remainingQuota === 0 },
          { label: "Maks",             value: teacher.maxQuota },
        ].map(({ label, value, highlight, red }) => (
          <div key={label} className="bg-white border rounded-lg px-4 py-2.5 text-sm">
            <span className="text-gray-400">{label}: </span>
            <span className={`font-semibold ${highlight ? "text-blue-600" : red ? "text-red-500" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Başarı mesajı */}
      {resultMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center justify-between">
          <span>{resultMsg}</span>
          <button onClick={() => setResultMsg("")} className="text-blue-400 hover:text-blue-600 ml-3">✕</button>
        </div>
      )}

      {/* Hata mesajı */}
      {finalizeError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
          <span>{finalizeError}</span>
          <button onClick={() => setFinalizeError("")} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* Kontenjan dolu uyarısı */}
      {remainingQuota === 0 && students.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          Kontenjanınız dolmuş. Tüm öğrenciler otomatik atama bekleyecek.
        </div>
      )}

      {/* Boş kuyruk */}
      {students.length === 0 && (
        <div className="text-gray-400 text-sm py-10 text-center bg-white border rounded-lg">
          1. tercih listenizdeki öğrenci yok.
        </div>
      )}

      {/* Öğrenci tablosu */}
      {students.length > 0 && (
        <>
          <div className="bg-white border rounded-lg overflow-x-auto mb-4">
           <div className="min-w-max">
            <div
              className="grid bg-gray-100 text-xs font-semibold p-3"
              style={{ gridTemplateColumns: `40px repeat(${columns.length + 1}, minmax(140px,1fr))` }}
            >
              <div />
              {columns.map((col: any) => <div key={col.key}>{col.label}</div>)}
              <div>Tercih Sırası</div>
            </div>

            {students.map((s) => {
              const isSelected = selectedIds.has(s._id);
              const isDisabled = !isSelected && selectedIds.size >= remainingQuota;

              return (
                <div
                  key={s._id}
                  onClick={() => { if (!isDisabled) toggleSelect(s._id); }}
                  className={`grid items-center p-3 border-t text-sm cursor-pointer transition-colors
                    ${isSelected
                      ? "bg-blue-50 border-l-2 border-l-blue-400"
                      : isDisabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-gray-50"
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
                    <div key={col.key}>{s.formData?.[col.key] || "-"}</div>
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

          {/* Onay butonu veya inline confirm */}
          {showConfirm ? (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{selectedIds.size} öğrenci</span> onaylanacak.
                {students.length - selectedIds.size > 0 && (
                  <> <span className="font-semibold">{students.length - selectedIds.size} öğrenci</span> onaylanmayacak — tüm hocalar tamamladığında otomatik atanacak.</>
                )}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFinalize}
                  disabled={loading}
                  className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium
                  hover:bg-black transition disabled:opacity-50"
                >
                  {loading ? "İşleniyor..." : "Evet, Onayla"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-white transition"
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
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium
                hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Onayla ve Tamamla
              </button>
              <p className="text-xs text-gray-400">
                Onaylanmayan öğrenciler, tüm hocalar tamamladığında otomatik atanır.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentApprovalPage;
