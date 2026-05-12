import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api",
});

// Token interceptor App.tsx'te kurulur (useAuth hook'u gerektirir).
// Burada sadece 401 handler var.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Sadece admin/teacher oturumu varsa login sayfasına yönlendir
      const role = localStorage.getItem("role");
      if (role === "admin" || role === "teacher") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;