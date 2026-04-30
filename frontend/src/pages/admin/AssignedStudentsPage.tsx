import React, { useEffect, useState } from "react";
import api from "../../services/api";

const AssignedStudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const s = await api.get("/admin/assigned");
    const t = await api.get("/teachers");

    setStudents(s.data);
    setTeachers(t.data);
  };
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Atanan Öğrenciler</h1>

      {teachers.map((teacher) => {
        const teacherStudents = students.filter(
          (s) => s.assignedTeacher?._id?.toString() === teacher._id?.toString(),
        );

        if (teacherStudents.length === 0) return null;

        return (
          <div key={teacher._id} className="mb-8">
            <h2 className="text-lg font-medium mb-3">{teacher.name}</h2>

            <div className="bg-white border rounded-lg">
              {teacherStudents.map((s) => (
                <div key={s._id} className="p-3 border-b text-sm">
                  {Object.values(s.formData).map((val: any, i) => (
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
    </div>
  );
};

export default AssignedStudentsPage;
