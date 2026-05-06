import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";

const StudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");

  const [search, setSearch] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [sortKey, setSortKey] = useState("date_desc");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchAll = async () => {
    try {
      const [sRes, fRes, tRes] = await Promise.all([
        api.get("/students"),
        api.get("/form"),
        api.get("/teachers"),
      ]);
      setStudents(sRes.data);
      setFormConfig(fRes.data);
      setTeachers(tRes.data);
    } catch {
      setFetchError("Veriler yüklenemedi.");
    }
  };

  useEffect(() => { document.title = "Başvuru Listesi"; }, []);
  useEffect(() => { fetchAll(); }, []);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const columns = formConfig?.textFields || [];
  const assignedCount = students.filter((s) => s.assignedTeacher).length;

  const processed = useMemo(() => {
    let list = [...students];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        Object.values(s.formData || {}).some((v: any) =>
          String(v).toLowerCase().includes(q)
        ) ||
        s.assignedTeacher?.name?.toLowerCase().includes(q)
      );
    }

    if (filterTeacher === "unassigned") {
      list = list.filter((s) => !s.assignedTeacher);
    } else if (filterTeacher) {
      list = list.filter(
        (s) => s.assignedTeacher?._id?.toString() === filterTeacher
      );
    }

    list.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortKey === "date_desc" || sortKey === "date_asc") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        return sortKey === "date_desc" ? bVal - aVal : aVal - bVal;
      }

      if (sortKey === "teacher") {
        aVal = a.assignedTeacher?.name || "zzz";
        bVal = b.assignedTeacher?.name || "zzz";
      } else {
        aVal = a.formData?.[sortKey] || "";
        bVal = b.formData?.[sortKey] || "";
      }

      const cmp = String(aVal).localeCompare(String(bVal), "tr");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [students, search, filterTeacher, sortKey, sortDir]);

  const exportExcel = () => {
    const header = ["Öğrenci No", "Danışman"];

    const rows = processed.map((s) => [
      s.formData?.ogrenciNo ?? "",
      s.assignedTeacher?.name ?? "Atanmamış",
    ]);

    const wsData = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = header.map((_: any, i: number) => ({
      wch: Math.max(header[i].length, ...rows.map((r) => String(r[i] ?? "").length), 14),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Başvurular");

    const suffix = filterTeacher === "unassigned"
      ? "_atanmamis"
      : filterTeacher
      ? `_${teachers.find((t) => t._id === filterTeacher)?.name ?? "hoca"}`
      : "";
    XLSX.writeFile(wb, `basvurular${suffix}.xlsx`);
  };

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;
  if (!formConfig) return <div className="p-6 text-gray-400">Yükleniyor...</div>;

  const sortIcon = (key: string) => {
    if (sortKey !== key) return <span className="text-gray-300 dark:text-zinc-700 ml-1">↕</span>;
    return (
      <span className="text-gray-700 dark:text-white ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  return (
    <div className="p-6 w-full">

      {/* ── Başlık ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Başvuru Listesi</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {students.length} başvuru
            {students.length > 0 && (
              <>
                <span className="mx-1.5 text-gray-200 dark:text-zinc-700">·</span>
                <span className="text-green-600">{assignedCount} atandı</span>
                <span className="mx-1.5 text-gray-200 dark:text-zinc-700">·</span>
                <span className="text-orange-500">{students.length - assignedCount} bekliyor</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {processed.length > 0 && (
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-zinc-300 border dark:border-zinc-800 rounded-lg
              px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
            >
              ↓ Excel İndir
              {(search || filterTeacher) && (
                <span className="text-xs text-gray-400">({processed.length})</span>
              )}
            </button>
          )}
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 border dark:border-zinc-800 rounded-lg
            px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-700 dark:hover:text-white transition"
          >
            <span className="text-base leading-none">↻</span> Yenile
          </button>
        </div>
      </div>

      {/* ── Filtre / Arama araç çubuğu ───────────────────────── */}
      {students.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-zinc-600 text-sm">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, numara, e-posta..."
              className="w-full border dark:border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm
              bg-white dark:bg-zinc-900 text-gray-900 dark:text-white
              focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white
              placeholder:text-gray-300 dark:placeholder:text-zinc-600"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-zinc-600
                hover:text-gray-500 dark:hover:text-zinc-400 transition text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="border dark:border-zinc-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900
            text-gray-600 dark:text-zinc-300
            focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
          >
            <option value="">Tüm öğrenciler</option>
            <option value="unassigned">Atanmamış</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          <select
            value={sortKey === "date_desc" || sortKey === "date_asc" ? sortKey : `${sortKey}_${sortDir}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "date_desc" || val === "date_asc") {
                setSortKey(val);
              } else {
                const [k, d] = val.split("_dir_");
                setSortKey(k);
                setSortDir(d as "asc" | "desc");
              }
            }}
            className="border dark:border-zinc-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900
            text-gray-600 dark:text-zinc-300
            focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
          >
            <option value="date_desc">Tarih (Yeni → Eski)</option>
            <option value="date_asc">Tarih (Eski → Yeni)</option>
            {columns.map((col: any) => (
              <>
                <option key={`${col.key}_asc`} value={`${col.key}_dir_asc`}>
                  {col.label} (A → Z)
                </option>
                <option key={`${col.key}_desc`} value={`${col.key}_dir_desc`}>
                  {col.label} (Z → A)
                </option>
              </>
            ))}
            <option value={`teacher_dir_asc`}>Danışman (A → Z)</option>
            <option value={`teacher_dir_desc`}>Danışman (Z → A)</option>
          </select>
        </div>
      )}

      {(search || filterTeacher) && (
        <p className="text-xs text-gray-400 mb-3">
          {processed.length} sonuç
          {search && <> · "<span className="font-medium">{search}</span>"</>}
          {filterTeacher === "unassigned" && <> · Atanmamış</>}
          {filterTeacher && filterTeacher !== "unassigned" && (
            <> · {teachers.find((t) => t._id === filterTeacher)?.name}</>
          )}
          <button
            onClick={() => { setSearch(""); setFilterTeacher(""); }}
            className="ml-2 text-gray-400 hover:text-gray-600 underline"
          >
            Temizle
          </button>
        </p>
      )}

      {/* ── Tablo ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl overflow-x-auto">
       <div className="min-w-max w-full">

        {columns.length > 0 && (
          <div
            className="grid bg-gray-50 dark:bg-zinc-900 border-b dark:border-zinc-800 text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(130px,1fr)) 200px 140px`,
            }}
          >
            {columns.map((col: any) => (
              <button
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="flex items-center text-left hover:text-gray-800 dark:hover:text-white transition uppercase tracking-wide"
              >
                {col.label}
                {sortIcon(col.key)}
              </button>
            ))}
            <div className="uppercase tracking-wide">Tercihler</div>
            <button
              onClick={() => handleSort("teacher")}
              className="flex items-center text-left hover:text-gray-800 dark:hover:text-white transition uppercase tracking-wide"
            >
              Durum {sortIcon("teacher")}
            </button>
          </div>
        )}

        {students.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-300 dark:text-zinc-700">
            Henüz başvuru yok.
          </div>
        )}

        {students.length > 0 && processed.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            Eşleşen öğrenci bulunamadı.
          </div>
        )}

        {processed.map((s) => (
          <div
            key={s._id}
            className="grid items-start px-4 py-3 border-b dark:border-zinc-800 last:border-b-0 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(130px,1fr)) 200px 140px`,
            }}
          >
            {columns.map((col: any) => (
              <div key={col.key} className="text-gray-700 dark:text-white pr-3">
                {s.formData?.[col.key] || <span className="text-gray-300 dark:text-zinc-700">—</span>}
              </div>
            ))}

            <div className="space-y-1 pr-3">
              {s.preferences?.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 text-[10px]
                    flex items-center justify-center font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  {p.name}
                </div>
              ))}
            </div>

            <div>
              {s.assignedTeacher ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium
                  text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {s.assignedTeacher.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium
                  text-orange-600 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  Bekliyor
                </span>
              )}
            </div>
          </div>
        ))}
       </div>
      </div>
    </div>
  );
};

export default StudentsPage;
