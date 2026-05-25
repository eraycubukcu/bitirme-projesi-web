import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/clerk-react";
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
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    const id = api.interceptors.request.use(async (config) => {
      // JWT varsa zaten api.ts'deki interceptor ekliyor, Clerk token'ı ekle
      if (!localStorage.getItem("token")) {
        const clerkToken = await getTokenRef.current();
        if (clerkToken) {
          config.headers["Authorization"] = `Bearer ${clerkToken}`;
        }
      }
      return config;
    });
    return () => api.interceptors.request.eject(id);
  }, []);

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

        <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
