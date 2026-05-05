import { useEffect, useState } from "react";
import api from "../../services/api";

const StudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");

  const fetchAll = async () => {
    try {
      const [sRes, fRes] = await Promise.all([api.get("/students"), api.get("/form")]);
      setStudents(sRes.data);
      setFormConfig(fRes.data);
    } catch {
      setFetchError("Veriler yüklenemedi.");
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;
  if (!formConfig) return <div className="p-6 text-gray-400">Yükleniyor...</div>;

  const columns = formConfig.textFields || [];
  const assignedCount = students.filter((s) => s.assignedTeacher).length;
  const unassignedCount = students.length - assignedCount;

  const filtered = search.trim()
    ? students.filter((s) => {
        const q = search.toLowerCase();
        return (
          Object.values(s.formData || {}).some((v: any) =>
            String(v).toLowerCase().includes(q)
          ) ||
          s.assignedTeacher?.name?.toLowerCase().includes(q) ||
          s.preferences?.some((p: any) => p.name?.toLowerCase().includes(q))
        );
      })
    : students;

  return (
    <div className="p-6 w-full max-w-6xl">

      {/* ── Başlık ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Başvuru Listesi</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tüm öğrenci başvuruları</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 text-sm text-gray-500 border rounded-lg
          px-3 py-1.5 hover:bg-gray-50 hover:text-gray-700 transition"
        >
          <span className="text-base leading-none">↻</span> Yenile
        </button>
      </div>

      {/* ── İstatistik kartları ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Toplam Başvuru", value: students.length, color: "text-gray-900" },
          { label: "Atandı",         value: assignedCount,   color: "text-green-600" },
          { label: "Bekliyor",       value: unassignedCount, color: unassignedCount > 0 ? "text-orange-500" : "text-gray-900" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Arama ───────────────────────────────────────────────────── */}
      {students.length > 0 && (
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, tercih veya danışmana göre ara..."
            className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm
            focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-300"
          />
        </div>
      )}

      {/* ── Tablo ───────────────────────────────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-x-auto">

        {/* Header */}
        {columns.length > 0 && (
          <div
            className="grid bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 border-b"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(130px,1fr)) 200px 140px`,
            }}
          >
            {columns.map((col: any) => (
              <div key={col.key}>{col.label}</div>
            ))}
            <div>Tercihler</div>
            <div>Durum</div>
          </div>
        )}

        {/* Boş durum */}
        {students.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-300">Henüz başvuru yok.</p>
          </div>
        )}

        {/* Arama sonucu boş */}
        {students.length > 0 && filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">Aramayla eşleşen öğrenci bulunamadı.</p>
          </div>
        )}

        {/* Satırlar */}
        {filtered.map((s, idx) => (
          <div
            key={s._id}
            className={`grid items-start px-4 py-3 text-sm border-b last:border-b-0
              hover:bg-gray-50 transition-colors
              ${idx % 2 === 0 ? "" : "bg-gray-50/40"}`}
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(130px,1fr)) 200px 140px`,
            }}
          >
            {/* Form verileri */}
            {columns.map((col: any) => (
              <div key={col.key} className="text-gray-700 pr-3">
                {s.formData?.[col.key] || (
                  <span className="text-gray-300">—</span>
                )}
              </div>
            ))}

            {/* Tercihler */}
            <div className="space-y-1 pr-3">
              {s.preferences?.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-[10px]
                    flex items-center justify-center font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  {p.name}
                </div>
              ))}
            </div>

            {/* Durum */}
            <div>
              {s.assignedTeacher ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700
                  bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {s.assignedTeacher.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600
                  bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  Bekliyor
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filtre sonucu bilgisi */}
      {search && filtered.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          {filtered.length} sonuç gösteriliyor
        </p>
      )}
    </div>
  );
};

export default StudentsPage;
