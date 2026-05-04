import { useEffect, useState } from "react";
import api from "../../services/api";

const StatCard = ({
  label,
  value,
  sub,
  color = "text-gray-900",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) => (
  <div className="bg-white border rounded-xl p-5">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [cascading, setCascading] = useState(false);

  const fetchData = () =>
    api.get("/admin/dashboard").then((res) => setData(res.data));

  useEffect(() => {
    fetchData();
  }, []);

  const handleCascade = async () => {
    const notFinished = data.teachers.filter((t: any) => !t.hasFinalized);
    const confirmMsg =
      notFinished.length > 0
        ? `${notFinished.length} hoca henüz onaylamamış:\n${notFinished.map((t: any) => `• ${t.name}`).join("\n")}\n\nYine de otomatik atamayı başlatmak istiyor musunuz?`
        : "Otomatik atamayı başlatmak istiyor musunuz?";

    if (!window.confirm(confirmMsg)) return;

    setCascading(true);
    try {
      const res = await api.post("/admin/cascade");
      alert(
        `${res.data.message}\nAtanan: ${res.data.assignedCount} | Atanmayan: ${res.data.unassignedCount}`,
      );
      await fetchData();
    } catch {
      alert("Cascade sırasında hata oluştu.");
    } finally {
      setCascading(false);
    }
  };

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

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleString("tr-TR") : "—";

  return (
    <div className="p-6 w-full max-w-4xl">
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      {/* Form durumu */}
      <div
        className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${
          formStatus?.isOpen
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Form Durumu:{" "}
            <span
              className={`font-semibold ${
                formStatus?.isOpen ? "text-green-600" : "text-gray-500"
              }`}
            >
              {formStatus?.isOpen ? "Açık" : "Kapalı"}
            </span>
          </p>
          {formStatus ? (
            <p className="text-xs text-gray-500">
              {formatDate(formStatus.startDate)} — {formatDate(formStatus.endDate)}
            </p>
          ) : (
            <p className="text-xs text-gray-400">Form ayarları yapılmamış</p>
          )}
        </div>
        <a
          href="/admin/form"
          className="text-xs text-gray-500 underline hover:text-gray-700"
        >
          Ayarla
        </a>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Toplam Başvuru" value={studentCount} />
        <StatCard
          label="Atanan"
          value={assignedCount}
          color="text-green-600"
          sub={
            studentCount > 0
              ? `%${Math.round((assignedCount / studentCount) * 100)}`
              : undefined
          }
        />
        <StatCard
          label="Atanmayan"
          value={unassignedCount}
          color={unassignedCount > 0 ? "text-red-500" : "text-gray-900"}
        />
        <StatCard label="Danışman" value={teacherCount} />
      </div>

      {/* Hoca onay durumu */}
      {teachers && teachers.length > 0 && (
        <div className="bg-white border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm">Hoca Onay Durumu</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {finalizedCount}/{teacherCount} hoca tamamladı
              </p>
            </div>

            {/* İlerleme çubuğu */}
            <div className="w-32">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    allFinalized ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{
                    width: `${teacherCount > 0 ? (finalizedCount / teacherCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Hoca listesi */}
          <div className="space-y-2 mb-4">
            {teachers.map((t: any) => (
              <div
                key={t._id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      t.hasFinalized ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span className={t.hasFinalized ? "text-gray-700" : "text-gray-400"}>
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {t.currentCount}/{t.maxQuota}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      t.hasFinalized ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {t.hasFinalized ? "Onayladı" : "Bekliyor"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Cascade durumu veya butonu */}
          {allFinalized ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
              Tüm hocalar onayladı. Otomatik atama gerçekleştirildi.
            </div>
          ) : (
            <div className="flex items-center justify-between pt-3 border-t">
              <p className="text-xs text-gray-400">
                Tüm hocalar onayladığında otomatik atama başlar.
              </p>
              <button
                onClick={handleCascade}
                disabled={cascading}
                className="text-xs px-3 py-1.5 border border-orange-300 text-orange-600
                rounded-lg hover:bg-orange-50 transition disabled:opacity-50"
              >
                {cascading ? "Çalışıyor..." : "Manuel Başlat"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
