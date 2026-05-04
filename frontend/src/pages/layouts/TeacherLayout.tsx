import { Outlet } from "react-router-dom";

const TeacherLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white border-r p-5 fixed top-0 left-0 h-screen flex flex-col">
        <h1 className="text-lg font-semibold mb-1">Hoca Paneli</h1>
        <p className="text-xs text-gray-400 mb-6">Danışman Sistemi</p>

        <nav className="space-y-2 flex-1">
          <a
            href="/teacher/students"
            className="block px-3 py-2 rounded-lg text-sm bg-gray-900 text-white"
          >
            Öğrenci Onay Listesi
          </a>
        </nav>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            window.location.href = "/admin/login";
          }}
          className="text-sm text-red-500"
        >
          Çıkış Yap
        </button>
      </div>

      <div className="flex-1 p-6 ml-64">
        <Outlet />
      </div>
    </div>
  );
};

export default TeacherLayout;
