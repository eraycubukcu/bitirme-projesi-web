import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const AdminLayout = () => {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Öğrenci Atama", path: "/admin/students" },
    { name: "Öğretmen Ayarları", path: "/admin/teachers" },
    { name: "Form Ayarları", path: "/admin/form" },
  ];
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-5">
        <h1 className="text-lg font-semibold mb-6">Admin Panel</h1>

        <nav className="space-y-2">
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

        {/* logout */}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/admin/login";
          }}
          className="mt-10 text-sm text-red-500"
        >
          Çıkış Yap
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
