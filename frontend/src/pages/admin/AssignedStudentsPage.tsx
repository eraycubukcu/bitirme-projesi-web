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
      alert(err.response?.data?.message || "Atama başarısız.");
    } finally {
      setAssigning(null);
    }
  };

  const exportTeacherExcel = (teacher: any, group: any[]) => {
    const columns: any[] = formConfig?.textFields || [];

    // Başlık satırı: form alanları
    const header = columns.map((col: any) => col.label);

    // Veri satırları
    const rows = group.map((s) =>
      columns.map((col: any) => s.formData?.[col.key] ?? ""),
    );

    const wsData = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Sütun genişliklerini otomatik ayarla
    ws["!cols"] = header.map((_: any, i: number) => ({
      wch: Math.max(
        header[i].length,
        ...rows.map((r) => String(r[i] ?? "").length),
        12,
      ),
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
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-1">Atama Sonuçları</h1>
      <p className="text-sm text-gray-400 mb-6">
        Atanan: {assigned.length} &nbsp;|&nbsp; Atanmayan: {unassigned.length}{" "}
        &nbsp;|&nbsp; Toplam: {students.length}
      </p>

      {/* Hocaya göre gruplar */}
      {teachers.map((teacher) => {
        const group = assigned.filter(
          (s) =>
            s.assignedTeacher?._id?.toString() === teacher._id?.toString(),
        );
        if (group.length === 0) return null;

        return (
          <div key={teacher._id} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold">{teacher.name}</h2>
                <span className="text-xs text-gray-400">
                  {group.length} / {teacher.maxQuota} öğrenci
                </span>
              </div>
              <button
                onClick={() => exportTeacherExcel(teacher, group)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300
                rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                ↓ Excel İndir
              </button>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              {columns.length > 0 && (
                <div
                  className="grid bg-gray-100 text-xs font-medium p-3"
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))`,
                  }}
                >
                  {columns.map((col: any) => (
                    <div key={col.key}>{col.label}</div>
                  ))}
                </div>
              )}

              {group.map((s) => (
                <div
                  key={s._id}
                  className="grid items-center p-3 border-t text-sm"
                  style={{
                    gridTemplateColumns:
                      columns.length > 0
                        ? `repeat(${columns.length}, minmax(120px, 1fr))`
                        : "1fr",
                  }}
                >
                  {columns.length > 0
                    ? columns.map((col: any) => (
                        <div key={col.key}>{s.formData?.[col.key] || "-"}</div>
                      ))
                    : Object.values(s.formData || {}).map((val: any, i) => (
                        <span key={i} className="mr-4">
                          {val}
                        </span>
                      ))}
                </div>
              ))}
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

          <div className="bg-white border border-red-100 rounded-lg overflow-x-auto">
            {columns.length > 0 && (
              <div
                className="grid bg-red-50 text-xs font-medium p-3"
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr)) 200px 140px`,
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
                className="grid items-center p-3 border-t text-sm"
                style={{
                  gridTemplateColumns:
                    columns.length > 0
                      ? `repeat(${columns.length}, minmax(120px, 1fr)) 200px 140px`
                      : "1fr",
                }}
              >
                {columns.map((col: any) => (
                  <div key={col.key}>{s.formData?.[col.key] || "-"}</div>
                ))}
                <div className="text-xs text-gray-400 space-y-0.5">
                  {s.preferences?.map((p: any, i: number) => (
                    <div key={i}>
                      {i + 1}. {p?.name || p}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <select
                    value={selectedTeacher[s._id] || ""}
                    onChange={(e) =>
                      setSelectedTeacher((prev) => ({
                        ...prev,
                        [s._id]: e.target.value,
                      }))
                    }
                    className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                    className="text-xs px-2 py-1 bg-gray-900 text-white rounded
                    disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition"
                  >
                    {assigning === s._id ? "Atanıyor..." : "Ata"}
                  </button>
                </div>
              </div>
            ))}
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
