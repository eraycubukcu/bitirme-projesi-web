import { Navigate, Route, Routes } from "react-router-dom";
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

function App() {
  return (
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
      </Route>
    </Routes>
  );
}

export default App;
