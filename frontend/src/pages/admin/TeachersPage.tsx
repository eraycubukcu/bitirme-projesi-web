import { useEffect, useState } from "react";
import api from "../../services/api";

const TeachersPage = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any>(null);

  const [name, setName] = useState("");
  const [minQuota, setMinQuota] = useState(0);
  const [maxQuota, setMaxQuota] = useState(0);

  const [loading, setLoading] = useState(false);

  const fetchTeachers = async () => {
    const res = await api.get("/teachers");
    setTeachers(res.data);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openAddModal = () => {
    setEditTeacher(null);
    setName("");
    setMinQuota(0);
    setMaxQuota(0);
    setShowModal(true);
  };

  const openEditModal = (t: any) => {
    setEditTeacher(t);
    setName(t.name);
    setMinQuota(t.minQuota);
    setMaxQuota(t.maxQuota);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name || maxQuota <= 0) return;

    if (minQuota > maxQuota) {
      alert("Min, max'tan büyük olamaz");
      return;
    }

    setLoading(true);

    try {
      if (editTeacher) {
        await api.put(`/teachers/${editTeacher._id}`, {
          name,
          minQuota,
          maxQuota,
        });
      } else {
        await api.post("/teachers", {
          name,
          minQuota,
          maxQuota,
        });
      }

      // 🔥 EN KRİTİK SATIR (sorunu çözen)
      await fetchTeachers();

      setShowModal(false);
    } catch (err: any) {
      console.log(err.response?.data);
      alert("İşlem başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Silmek istediğine emin misin?");
    if (!ok) return;

    try {
      await api.delete(`/teachers/${id}`);
      await fetchTeachers();
    } catch {
      alert("Silinemedi");
    }
  };

  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-2">Danışman Bilgisi</h1>

      <button
        onClick={openAddModal}
        className="mb-6 px-4 py-2 bg-gray-900 text-white rounded-xl"
      >
        Danışman Ekle
      </button>

      {/* LIST */}
      <div className="space-y-3">
        {teachers.map((t) => (
          <div
            key={t._id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-gray-500">
                Min: {t.minQuota} | Max: {t.maxQuota}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openEditModal(t)}
                className="text-blue-500 text-sm"
              >
                Düzenle
              </button>

              <button
                onClick={() => handleDelete(t._id)}
                className="text-red-500 text-sm"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-80 space-y-4">
            <h2 className="font-semibold">
              {editTeacher ? "Danışman Güncelle" : "Danışman Ekle"}
            </h2>

            {/* NAME */}
            <div className="relative">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=" "
                className="peer w-full border rounded px-3 pt-5 pb-2 text-sm
                focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <label
                className="absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
                transition-all
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs
                pointer-events-none"
              >
                İsim
              </label>
            </div>

            {/* MIN MAX */}
            <div className="flex gap-2">
              <div className="relative w-1/2">
                <input
                  type="number"
                  min="0"
                  value={minQuota}
                  onChange={(e) => setMinQuota(Number(e.target.value))}
                  placeholder=" "
                  className="peer w-full border rounded px-3 pt-5 pb-2 text-sm
                  focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
                <label
                  className="absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
                  transition-all
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                  peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                  peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs
                  pointer-events-none"
                >
                  Min Öğrenci
                </label>
              </div>

              <div className="relative w-1/2">
                <input
                  type="number"
                  min="0"
                  value={maxQuota}
                  onChange={(e) => setMaxQuota(Number(e.target.value))}
                  placeholder=" "
                  className="peer w-full border rounded px-3 pt-5 pb-2 text-sm
                  focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
                <label
                  className="absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
                  transition-all
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                  peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                  peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs
                  pointer-events-none"
                >
                  Max Öğrenci
                </label>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 rounded-xl disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : editTeacher ? "Güncelle" : "Ekle"}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-sm bg-gray-200 rounded-xl py-2"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;
