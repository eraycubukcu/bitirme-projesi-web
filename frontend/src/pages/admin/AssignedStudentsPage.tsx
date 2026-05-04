import { useEffect, useState } from "react";
import api from "../../services/api";

const AssignedStudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formConfig, setFormConfig] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get("/admin/assigned"),
      api.get("/teachers"),
      api.get("/form"),
    ]).then(([sRes, tRes, fRes]) => {
      setStudents(sRes.data);
      setTeachers(tRes.data);
      setFormConfig(fRes.data);
    });
  }, []);

  if (!formConfig) return null;

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
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-base font-semibold">{teacher.name}</h2>
              <span className="text-xs text-gray-400">
                {group.length} / {teacher.maxQuota} öğrenci
              </span>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              {/* Header */}
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
                  gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr)) 220px`,
                }}
              >
                {columns.map((col: any) => (
                  <div key={col.key}>{col.label}</div>
                ))}
                <div>Tercihler</div>
              </div>
            )}

            {unassigned.map((s) => (
              <div
                key={s._id}
                className="grid items-start p-3 border-t text-sm"
                style={{
                  gridTemplateColumns:
                    columns.length > 0
                      ? `repeat(${columns.length}, minmax(120px, 1fr)) 220px`
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
