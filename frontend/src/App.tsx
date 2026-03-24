import { Route, Routes } from "react-router-dom";
import FormPage from "./pages/public/FormPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />}></Route>
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