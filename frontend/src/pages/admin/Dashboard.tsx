import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

interface CascadeResult {
  message: string;
  assignedCount: number;
  unassignedCount: number;
}

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");
  const [cascading, setCascading] = useState(false);
  const [showCascadeConfirm, setShowCascadeConfirm] = useState(false);
  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(null);
  const [cascadeError, setCascadeError] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data);
    } catch {
      setFetchError("Dashboard verisi yüklenemedi.");
    }
  };

  useEffect(() => { document.title = "Dashboard"; }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleCascade = async () => {
    setCascading(true);
    setShowCascadeConfirm(false);
    setCascadeResult(null);
    setCascadeError("");
    try {
      const res = await api.post("/admin/cascade");
      setCascadeResult(res.data);
      await fetchData();
    } catch {
      setCascadeError("Otomatik atama sırasında hata oluştu.");
    } finally {
      setCascading(false);
    }
  };

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;
  if (!data) return <div className="p-6 text-gray-400">Yükleniyor...</div>;

  const {
    studentCount,
    teacherCount,
    assignedCount,
    unassignedCount,
    formStatus,
    teachers,
    finalizedCount,
    allFinalized,
  } = data;

  const assignedPct = studentCount > 0 ? Math.round((assignedCount / studentCount) * 100) : 0;
  const notFinished: any[] = (teachers ?? []).filter((t: any) => !t.hasFinalized);

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div className="p-4 sm:p-6 w-full max-w-3xl mx-auto">

      {/* ── Başlık ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Danışman Atama Sistemi</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 border dark:border-zinc-800 rounded-lg
          px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-700 dark:hover:text-white transition"
        >
          <span className="text-base leading-none">↻</span> Yenile
        </button>
      </div>

      {/* ── Form durumu ────────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-6 ${
          formStatus?.isOpen
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              formStatus?.isOpen ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-white">Başvuru Formu</span>
            <span
              className={`ml-2 text-sm font-semibold ${
                formStatus?.isOpen ? "text-green-600" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {formStatus?.isOpen ? "Açık" : "Kapalı"}
            </span>
          </div>
          {formStatus && (
            <span className="hidden sm:inline text-xs text-gray-400">
              {formatDate(formStatus.startDate)} — {formatDate(formStatus.endDate)}
            </span>
          )}
        </div>
        <Link
          to="/admin/form"
          className="text-xs text-gray-500 dark:text-gray-400 border dark:border-zinc-700 rounded px-2 py-1
          hover:bg-white dark:hover:bg-zinc-900 hover:text-gray-700 dark:hover:text-white transition"
        >
          Ayarla
        </Link>
      </div>

      {/* ── İstatistikler ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Toplam Başvuru", value: studentCount, color: "" },
          { label: "Atanan",         value: assignedCount,   color: "text-green-600" },
          { label: "Bekleyen",       value: unassignedCount, color: unassignedCount > 0 ? "text-red-500" : "" },
          { label: "Danışman",       value: teacherCount,    color: "" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color || "text-gray-900 dark:text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Atama ilerleme çubuğu ──────────────────────────────────── */}
      {studentCount > 0 && (
        <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-white">Atama Durumu</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {assignedCount} / {studentCount}
              <span className="text-xs font-normal text-gray-400 ml-1">(%{assignedPct})</span>
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                assignedPct === 100 ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${assignedPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-400">
            <span>{assignedCount} atandı</span>
            <span>{unassignedCount} bekliyor</span>
          </div>
        </div>
      )}

      {/* ── Hoca onay durumu ───────────────────────────────────────── */}
      {teachers && teachers.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-white">Danışman Onay Durumu</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {finalizedCount} / {teacherCount} tamamladı
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    allFinalized ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{
                    width: `${teacherCount > 0 ? (finalizedCount / teacherCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">
                %{teacherCount > 0 ? Math.round((finalizedCount / teacherCount) * 100) : 0}
              </span>
            </div>
          </div>

          {/* Hoca listesi */}
          <div className="space-y-1 mb-4">
            {teachers.map((t: any) => (
              <div
                key={t._id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  t.hasFinalized
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-gray-50 dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      t.hasFinalized ? "bg-green-500" : "bg-gray-300 dark:bg-zinc-600"
                    }`}
                  />
                  <span
                    className={
                      t.hasFinalized
                        ? "text-gray-700 dark:text-white font-medium"
                        : "text-gray-400 dark:text-zinc-500"
                    }
                  >
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="w-16 bg-gray-200 dark:bg-zinc-800 rounded-full h-1">
                      <div
                        className="bg-gray-400 dark:bg-zinc-500 h-1 rounded-full"
                        style={{
                          width: `${t.maxQuota > 0 ? Math.min((t.currentCount / t.maxQuota) * 100, 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">
                      {t.currentCount}/{t.maxQuota}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 sm:hidden">
                    {t.currentCount}/{t.maxQuota}
                  </span>
                  <span
                    className={`text-xs font-medium text-right ${
                      t.hasFinalized ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {t.hasFinalized ? "Onayladı" : "Bekliyor"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Cascade bölümü ──────────────────────────────────────── */}
          <div className="pt-3 border-t dark:border-zinc-800 space-y-3">
            {formStatus?.cascadeDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Otomatik atama: {formatDate(formStatus.cascadeDate)}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  formStatus.cascadeExecuted
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                }`}>
                  {formStatus.cascadeExecuted ? "Tamamlandı" : "Bekliyor"}
                </span>
              </div>
            )}

            {cascadeResult && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                <span>
                  Atama tamamlandı — Atanan: {cascadeResult.assignedCount},
                  Bekleyen: {cascadeResult.unassignedCount}
                </span>
                <button
                  onClick={() => setCascadeResult(null)}
                  className="ml-3 text-blue-400 hover:text-blue-600 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            )}
            {cascadeResult && cascadeResult.unassignedCount > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-xs text-orange-700 dark:text-orange-300 flex items-center justify-between">
                <span>{cascadeResult.unassignedCount} öğrenci atanamadı — kapasite yetersiz.</span>
                <Link
                  to="/admin/assignedStudents"
                  className="underline font-medium ml-2 flex-shrink-0"
                >
                  Manuel ata →
                </Link>
              </div>
            )}
            {cascadeError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
                <span>{cascadeError}</span>
                <button
                  onClick={() => setCascadeError("")}
                  className="ml-3 text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            {!cascadeResult && showCascadeConfirm ? (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg space-y-2">
                <p className="text-xs text-gray-600 dark:text-zinc-300">
                  Onaylanmayan öğrenciler 2. tercihlerinden itibaren atanacak.
                  Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCascade}
                    disabled={cascading}
                    className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg
                    hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {cascading ? "Çalışıyor..." : "Evet, Başlat"}
                  </button>
                  <button
                    onClick={() => setShowCascadeConfirm(false)}
                    className="text-xs px-3 py-1.5 border dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-300
                    hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : !cascadeResult && allFinalized ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Tüm danışmanlar onayladı. Atamayı başlatabilirsiniz.
                </p>
                <button
                  onClick={() => {
                    setCascadeResult(null);
                    setCascadeError("");
                    setShowCascadeConfirm(true);
                  }}
                  disabled={cascading}
                  className="text-xs px-3 py-1.5 border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400
                  rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition disabled:opacity-50 flex-shrink-0"
                >
                  Manuel Başlat
                </button>
              </div>
            ) : !cascadeResult ? (
              <p className="text-xs text-gray-400">
                Tüm danışmanlar onayladığında atamayı başlatabilirsiniz. ({finalizedCount}/{teacherCount})
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
