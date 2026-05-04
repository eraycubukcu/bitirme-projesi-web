import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: any;
  requiredRole?: "admin" | "teacher";
}) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
