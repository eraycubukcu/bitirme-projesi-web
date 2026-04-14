import { Route, Routes } from "react-router-dom";
import FormPage from "./pages/public/FormPage";
import LoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./pages/layouts/AdminLayout";
import ProtectedRoute from "./pages/components/ProtectedRoute";
import Dashboard from "./pages/admin/Dashboard";
import StudentsPage from "./pages/admin/StudentsPage";
import TeachersPage from "./pages/admin/TeachersPage";
import FormSettingsPage from "./pages/admin/FormSettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />

      <Route path="/admin/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="form" element={<FormSettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;

/* To do list : 
  - Validation kısmı nasıl yapılacak öğrenci no'ya göre mi ?
  - admin panel 
  - admin panelde öğrenci listeleme
  - öğretmen atama sistemi
  - hocaların max min alabileceği öğrenci sayısını ayarlama olayı
  - admin panelde hoca ekle/sil/kontenjan ekle azalt
  - ayrı bir kısım olarak tüm atamalara gerçekleştikten sonra tüm öğrenci - hoca listesini getir
  - tüm öğrenciler atandıktan sonra excel dosyasına aktar butonu tarzı bir olay yapıp dosya şeklinde çıkartma eklenebilir!
  - formun aktiflik durumunu ayarlama olayını düzenle
*/
