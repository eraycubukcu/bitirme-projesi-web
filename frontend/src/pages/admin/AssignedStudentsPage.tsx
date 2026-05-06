import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";

const AssignedStudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignError, setAssignError] = useState("");

  const fetchAll = async () => {
    try {
      const [sRes, tRes, fRes] = await Promise.all([
        api.get("/admin/assigned"),
        api.get("/teachers"),
        api.get("/form"),
      ]);
      setStudents(sRes.data);
      setTeachers(tRes.data);
      setFormConfig(fRes.data);
    } catch {
      setFetchError("Veriler yüklenemedi.");
    }
  };

  useEffect(() => { document.title = "Atama Sonuçları"; }, []);
  useEffect(() => {
    fetchAll();
  }, []);

  const handleAssign = async (studentId: string) => {
    const teacherId = selectedTeacher[studentId];
    if (!teacherId) return;
    setAssigning(studentId);
    try {
      await api.post("/admin/assigned", { studentId, teacherId });
      await fetchAll();
    } catch (err: any) {
      setAssignError(err.response?.data?.message || "Atama başarısız.");
    } finally {
      setAssigning(null);
    }
  };

  const exportTeacherExcel = (teacher: any, group: any[]) => {
    const header = ["Öğrenci No", "Danışman"];
    const rows = group.map((s) => [
      s.formData?.ogrenciNo ?? "",
      teacher.name,
    ]);

    const wsData = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = header.map((_: any, i: number) => ({
      wch: Math.max(header[i].length, ...rows.map((r) => String(r[i] ?? "").length), 14),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, teacher.name.slice(0, 31));

    const safeFileName = teacher.name
      .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ _-]/g, "")
      .trim();
    XLSX.writeFile(wb, `${safeFileName}_ogrenciler.xlsx`);
  };

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;
  if (!formConfig) return <div className="p-6 text-gray-400">Yükleniyor...</div>;

  const columns: any[] = formConfig.textFields || [];
  const assigned = students.filter((s) => s.assignedTeacher);
  const unassigned = students.filter((s) => !s.assignedTeacher);

  return (
    <div className="p-4 sm:p-6 w-full">
      <h1 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Atama Sonuçları</h1>
      <p className="text-sm text-gray-400 mb-4">
        Atanan: {assigned.length} · Atanmayan: {unassigned.length} · Toplam: {students.length}
      </p>

      {assignError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{assignError}</span>
          <button onClick={() => setAssignError("")} className="ml-3 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Hocaya göre gruplar */}
      {teachers.map((teacher) => {
        const group = assigned.filter(
          (s) => s.assignedTeacher?._id?.toString() === teacher._id?.toString(),
        );
        if (group.length === 0) return null;

        return (
          <div key={teacher._id} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{teacher.name}</h2>
                <span className="text-xs text-gray-400">
                  {group.length} / {teacher.maxQuota} öğrenci
                </span>
              </div>
              <button
                onClick={() => exportTeacherExcel(teacher, group)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300 dark:border-zinc-700
                rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
              >
                ↓ Excel İndir
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-lg overflow-x-auto">
              <div className="min-w-max">
                {columns.length > 0 && (
                  <div
                    className="grid bg-gray-100 dark:bg-zinc-900 text-xs font-medium p-3 text-gray-600 dark:text-zinc-300"
                    style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))` }}
                  >
                    {columns.map((col: any) => (
                      <div key={col.key}>{col.label}</div>
                    ))}
                  </div>
                )}
                {group.map((s) => (
                  <div
                    key={s._id}
                    className="grid items-center p-3 border-t dark:border-zinc-800 text-sm text-gray-700 dark:text-white"
                    style={{
                      gridTemplateColumns: columns.length > 0
                        ? `repeat(${columns.length}, minmax(120px, 1fr))`
                        : "1fr",
                    }}
                  >
                    {columns.length > 0
                      ? columns.map((col: any) => (
                          <div key={col.key}>{s.formData?.[col.key] || "-"}</div>
                        ))
                      : Object.values(s.formData || {}).map((val: any, i) => (
                          <span key={i} className="mr-4">{val}</span>
                        ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Atanmayan öğrenciler */}
      {unassigned.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-base font-semibold text-red-600">
              Atanmayan Öğrenciler
            </h2>
            <span className="text-xs text-red-400">{unassigned.length} öğrenci</span>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-red-100 dark:border-red-900/50 rounded-lg overflow-x-auto">
            <div className="min-w-max">
              {columns.length > 0 && (
                <div
                  className="grid bg-red-50 dark:bg-red-900/20 text-xs font-medium p-3 text-gray-600 dark:text-zinc-300"
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr)) 180px 160px`,
                  }}
                >
                  {columns.map((col: any) => (
                    <div key={col.key}>{col.label}</div>
                  ))}
                  <div>Tercihler</div>
                  <div>Manuel Ata</div>
                </div>
              )}
              {unassigned.map((s) => (
                <div
                  key={s._id}
                  className="grid items-center p-3 border-t dark:border-zinc-800 text-sm text-gray-700 dark:text-white"
                  style={{
                    gridTemplateColumns: columns.length > 0
                      ? `repeat(${columns.length}, minmax(120px, 1fr)) 180px 160px`
                      : "1fr",
                  }}
                >
                  {columns.map((col: any) => (
                    <div key={col.key}>{s.formData?.[col.key] || "-"}</div>
                  ))}
                  <div className="text-xs text-gray-400 space-y-0.5">
                    {s.preferences?.map((p: any, i: number) => (
                      <div key={i}>{i + 1}. {p?.name || p}</div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5 pr-2">
                    <select
                      value={selectedTeacher[s._id] || ""}
                      onChange={(e) => setSelectedTeacher((prev) => ({ ...prev, [s._id]: e.target.value }))}
                      className="border dark:border-zinc-700 rounded px-2 py-1.5 text-xs
                      bg-white dark:bg-zinc-900 text-gray-700 dark:text-white
                      focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                    >
                      <option value="">Hoca seç...</option>
                      {teachers
                        .filter((t) => t.currentCount < t.maxQuota)
                        .map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name} ({t.currentCount}/{t.maxQuota})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleAssign(s._id)}
                      disabled={!selectedTeacher[s._id] || assigning === s._id}
                      className="text-xs px-2 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded
                      disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black dark:hover:bg-zinc-100 transition"
                    >
                      {assigning === s._id ? "Atanıyor..." : "Ata"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {assigned.length === 0 && unassigned.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Henüz başvuru yok.
        </div>
      )}
    </div>
  );
};

export default AssignedStudentsPage;
