# Bitirme Projesi Danışman Seçim Sistemi

Öğrencilerin bitirme projesi danışmanlarını tercih sırasına göre seçtiği, danışmanların öğrenci onayladığı ve süre dolduğunda kalan öğrencilerin otomatik olarak atandığı web uygulaması.

## Özellikler

**Öğrenci**
- Okul hesabıyla (Google / Clerk) giriş
- Danışman tercih sıralaması (sürükle-bırak veya ok tuşları)
- Form açıkken tercih güncelleme

**Danışman**
- Kendisini birinci tercih olarak seçen öğrencileri görme
- Kontenjan dolana kadar öğrenci onaylama
- Profil biyografisi düzenleme

**Admin**
- Danışman ekleme / düzenleme / silme
- Form açılış-kapanış tarihi ve alan ayarları
- Otomatik atama tarihi belirleme
- Atama sonuçlarını Excel olarak indirme

**Otomatik Atama (Cascade)**
- Tüm danışmanlar onayını tamamladıktan sonra admin başlatır
- Atanmamış öğrenciler ikinci ve sonraki tercihlerine GPA önceliğiyle atanır
- Süre geçmiş olsa bile danışmanlar tamamlamadan sistem otomatik başlamaz

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Auth | Clerk (öğrenci) · JWT (danışman/admin) |
| Backend | Node.js, Express 5 |
| Veritabanı | MongoDB, Mongoose |
| Güvenlik | Helmet, express-rate-limit, bcryptjs |

## Kurulum

### Gereksinimler
- Node.js 18+
- MongoDB bağlantısı (Atlas veya yerel)
- Clerk hesabı

### Backend

```bash
cd backend
npm install
```

`backend/.env` dosyası oluştur:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=en_az_32_karakter_guclu_secret
CLERK_SECRET_KEY=sk_...
ALLOWED_EMAIL_DOMAIN=okul.edu.tr
CORS_ORIGIN=http://localhost:5173
```

```bash
npm start
```

### Frontend

```bash
cd frontend
npm install
```

`frontend/.env` dosyası oluştur:

```env
VITE_API_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_ALLOWED_EMAIL_DOMAIN=okul.edu.tr
```

```bash
npm run dev
```

### Seed (İlk Kurulum)

```bash
cd backend
npm run seed        # Admin + danışmanlar + form config
```

## Kullanım Akışı

```
Öğrenci formu doldurur → Danışmanlar öğrenci seçer
→ Admin otomatik atamayı başlatır → Sonuçlar Excel'e aktarılır
```

1. Admin form açılış/kapanış tarihini ayarlar
2. Öğrenciler okul hesabıyla giriş yapıp tercih sıralarını belirler
3. Danışmanlar kendi panellerinde birinci tercih öğrencileri onaylar
4. Tüm danışmanlar tamamladığında admin otomatik atamayı başlatır
5. Kalan öğrenciler sıradaki tercihlerine ve GPA'ya göre atanır
6. Admin atama sonuçlarını Excel olarak indirebilir

## Proje Yapısı

```
bitirme-web/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── index.js
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        │   ├── admin/
        │   ├── teacher/
        │   └── public/
        └── services/
```
