import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { name: "Dashboard",        path: "/admin/dashboard" },
    { name: "Başvuru Listesi",  path: "/admin/students" },
    { name: "Danışman Ayarları",path: "/admin/teachers" },
    { name: "Form Ayarları",    path: "/admin/form" },
    { name: "Atama Sonuçları",  path: "/admin/assignedStudents" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white border-r p-5 fixed top-0 left-0 h-screen flex flex-col">
        <h1 className="text-lg font-semibold mb-1">Admin Panel</h1>
        <p className="text-xs text-gray-400 mb-6">Danışman Sistemi</p>

        <nav className="space-y-2 flex-1">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-lg text-sm transition
              ${
                location.pathname === item.path
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 transition text-left"
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

export default AdminLayout;
