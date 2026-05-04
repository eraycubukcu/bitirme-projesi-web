import { useEffect, useState } from "react";
import api from "../../services/api";

const StudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/students"), api.get("/form")])
      .then(([sRes, fRes]) => {
        setStudents(sRes.data);
        setFormConfig(fRes.data);
      })
      .catch(() => setFetchError("Veriler yüklenemedi."));
  }, []);

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;
  if (!formConfig) return <div className="p-6 text-gray-400">Yükleniyor...</div>;

  const columns = formConfig.textFields || [];

  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-1">Başvuru Listesi</h1>
      <p className="text-sm text-gray-400 mb-5">
        Toplam {students.length} başvuru
      </p>

      <div className="bg-white border rounded-lg overflow-x-auto">
        {/* Header */}
        <div
          className="grid bg-gray-100 text-sm font-medium p-3"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(130px,1fr)) 220px 120px`,
          }}
        >
          {columns.map((col: any) => (
            <div key={col.key}>{col.label}</div>
          ))}
          <div>Tercihler</div>
          <div>Durum</div>
        </div>

        {students.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-400">
            Henüz başvuru yok.
          </div>
        )}

        {/* Rows */}
        {students.map((s) => (
          <div
            key={s._id}
            className="grid items-start p-3 border-t text-sm"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(130px,1fr)) 220px 120px`,
            }}
          >
            {columns.map((col: any) => (
              <div key={col.key}>{s.formData?.[col.key] || "-"}</div>
            ))}

            {/* Tercihler */}
            <div className="text-xs text-gray-500 space-y-0.5">
              {s.preferences?.map((p: any, i: number) => (
                <div key={i}>
                  {i + 1}. {p.name}
                </div>
              ))}
            </div>

            {/* Durum */}
            <div>
              {s.assignedTeacher ? (
                <span className="text-green-600 font-medium text-xs">
                  {s.assignedTeacher.name}
                </span>
              ) : (
                <span className="text-yellow-600 font-medium text-xs">
                  Bekliyor
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsPage;
