import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "@clerk/clerk-react";
import FormPage from "./pages/public/FormPage";
import LoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./pages/layouts/AdminLayout";
import TeacherLayout from "./pages/layouts/TeacherLayout";
import ProtectedRoute from "./pages/components/ProtectedRoute";
import Dashboard from "./pages/admin/Dashboard";
import StudentsPage from "./pages/admin/StudentsPage";
import TeachersPage from "./pages/admin/TeachersPage";
import FormSettingsPage from "./pages/admin/FormSettingsPage";
import AssignedStudentsPage from "./pages/admin/AssignedStudentsPage";
import StudentApprovalPage from "./pages/teacher/StudentApprovalPage";
import ProfilePage from "./pages/teacher/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import api from "./services/api";

function App() {
  const { getToken } = useAuth();

  useEffect(() => {
    const id = api.interceptors.request.use(async (config) => {
      // Clerk oturumu varsa Clerk token'ını kullan (öğrenci formu)
      const clerkToken = await getToken();
      if (clerkToken) {
        config.headers["Authorization"] = `Bearer ${clerkToken}`;
        return config;
      }
      // Clerk oturumu yoksa localStorage JWT'yi kullan (admin/hoca)
      const jwtToken = localStorage.getItem("token");
      if (jwtToken) {
        config.headers["Authorization"] = `Bearer ${jwtToken}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(id);
  }, [getToken]);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<FormPage />} />

        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin paneli */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="form" element={<FormSettingsPage />} />
          <Route path="assignedStudents" element={<AssignedStudentsPage />} />
        </Route>

        {/* Hoca paneli */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="students" replace />} />
          <Route path="students" element={<StudentApprovalPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
