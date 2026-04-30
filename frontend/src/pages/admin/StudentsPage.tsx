import { useEffect, useState } from "react";
import api from "../../services/api";

const StudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<any>({});

  const fetchStudents = async () => {
    const res = await api.get("/students");
    setStudents(res.data);
  };

  const fetchTeachers = async () => {
    const res = await api.get("/teachers");
    setTeachers(res.data);
  };

  const fetchFormConfig = async () => {
    const res = await api.get("/form");
    setFormConfig(res.data);
  };

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchFormConfig();
  }, []);

  const columns = formConfig?.textFields || [];

  const handleAssign = async (studentId: string) => {
    const teacherId = selectedTeachers[studentId];

    if (!teacherId) {
      alert("Öğretmen seç");
      return;
    }

    try {
      await api.post(`/admin/assign`, {
        teacherId,
        studentId,
      });

      await fetchStudents();
    } catch (err: any) {
      console.log(err);
      alert("Atama başarısız");
    }
  };

  if (!formConfig) return null;

  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-6">Başvurular</h1>

      <div className="bg-white border rounded-lg overflow-x-auto">
        {/* HEADER */}
        <div
          className="grid bg-gray-100 text-sm font-medium p-3"
          style={{
            gridTemplateColumns: `repeat(${columns.length + 3}, minmax(120px,1fr))`,
          }}
        >
          {columns.map((col: any) => (
            <div key={col.key} className="capitalize">
              {col.label}
            </div>
          ))}
          <div>Tercihler</div>
          <div>Atama</div>
          <div>Durum</div>
        </div>

        {/* ROWS */}
        {students.map((s) => {
          const assignedTeacher = teachers.find(
            (t) => t._id?.toString() === s.assignedTeacher?.toString(),
          );

          return (
            <div
              key={s._id}
              className="grid items-center p-3 border-t text-sm"
              style={{
                gridTemplateColumns: `repeat(${columns.length + 3}, minmax(120px,1fr))`,
              }}
            >
              {columns.map((col: any) => (
                <div key={col.key}>
                  {s.formData?.[col.key] || "-"}
                </div>
              ))}

              <div>
                <select
                  className="border px-2 py-1 rounded"
                  value={
                    selectedTeachers[s._id] ||
                    s.assignedTeacher?._id ||
                    s.assignedTeacher ||
                    ""
                  }
                  disabled={!!s.assignedTeacher}
                  onChange={(e) =>
                    setSelectedTeachers((prev: any) => ({
                      ...prev,
                      [s._id]: e.target.value,
                    }))
                  }
                >
                  <option value="">Seç</option>

                  {s.preferences.map((p: any, i: number) => {
                    const teacher = teachers.find(
                      (t) => t._id.toString() === p._id.toString(),
                    );

                    return (
                      <option key={i} value={p._id}>
                        {i + 1}. {teacher?.name || "Hoca yok"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <button
                  onClick={() => handleAssign(s._id)}
                  disabled={!!s.assignedTeacher}
                  className={`px-3 py-1 rounded text-sm w-40 ${
                    s.assignedTeacher
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  Ata
                </button>
              </div>

              <div>
                {s.assignedTeacher ? (
                  <span className="text-green-600 font-medium">
                    {assignedTeacher?.name || "Atandı"}
                  </span>
                ) : (
                  <span className="text-yellow-600 font-medium">
                    Bekliyor
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentsPage;