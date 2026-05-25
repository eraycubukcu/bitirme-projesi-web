import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api",
});

// JWT token'ı her istekte otomatik ekle (admin/teacher)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const role = localStorage.getItem("role");
      const url = error.config?.url || "";
      const isAdminOrTeacherEndpoint =
        url.startsWith("/admin") || url.startsWith("/teachers");

      if ((role === "admin" || role === "teacher") && isAdminOrTeacherEndpoint) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/admin/login";
      }
    }

    if (!error.response && error.message === "Network Error") {
      error.message = "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.";
    }

    return Promise.reject(error);
  }
);

export default api;
