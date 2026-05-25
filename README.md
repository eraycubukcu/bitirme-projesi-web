# Bitirme Projesi Danışman Seçim Sistemi

Öğrencilerin bitirme projesi danışmanlarını tercih sırasına göre seçtiği, danışmanların öğrenci onayladığı ve süre dolduğunda kalan öğrencilerin otomatik olarak atandığı web uygulaması.

## Özellikler

**Öğrenci**
- Okul hesabıyla (Google / Clerk) giriş
- Danışman tercih sıralaması (sürükle-bırak veya ok tuşları)
- Form açıkken tercih güncelleme
- Atama tamamlandığında form düzenleme engeli

**Danışman**
- Kendisini birinci tercih olarak seçen öğrencileri görme
- Kontenjan dolana kadar öğrenci onaylama
- Seçimleri güncelleme (admin atamayı başlatana kadar)
- Profil biyografisi düzenleme

**Admin**
- Dashboard ile genel durum takibi
- Başvuru listesi (arama, filtreleme, sıralama, Excel export)
- Danışman ekleme / düzenleme / silme
- Form alan yönetimi (sabit/dinamik alanlar, alan tipleri)
- Form açılış-kapanış tarihi ayarlama
- Otomatik atama tarihi belirleme
- Manuel veya zorla cascade tetikleme
- Atama sonuçlarını danışman bazlı Excel olarak indirme

**Otomatik Atama (Cascade)**
- Tüm danışmanlar onayını tamamladıktan sonra admin başlatır
- Atanmamış öğrenciler sıradaki tercihlerine GPA önceliğiyle atanır
- Atomik kota kontrolü ile kontenjan aşımı engellenir
- Concurrent çalışma kilidi ile çift atama önlenir
- Cascade tarihi geldiğinde ve tüm hocalar onayladığında otomatik çalışır

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Auth | Clerk (öğrenci OAuth) · JWT (danışman/admin) |
| Backend | Node.js, Express 5 |
| Veritabanı | MongoDB, Mongoose |
| Güvenlik | Helmet, express-rate-limit, bcryptjs |
| Diğer | Axios, xlsx (Excel export), Sonner (toast) |

## Kurulum

### Gereksinimler
- Node.js 18+
- MongoDB bağlantısı (Atlas veya yerel)
- Clerk hesabı (öğrenci girişi için)

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

### İlk Kurulum

```bash
cd backend
npm run seed:admin   # Varsayılan admin hesabı oluşturur
```

Admin girişi yapıldıktan sonra danışmanlar ve form ayarları admin panelinden yapılır.

## Kullanım Akışı

1. Admin form alanlarını ve açılış/kapanış tarihini ayarlar
2. Öğrenciler okul hesabıyla giriş yapıp formu doldurur ve tercih sırasını belirler
3. Danışmanlar kendi panellerinde birinci tercih öğrencileri onaylar
4. Tüm danışmanlar tamamladığında admin otomatik atamayı başlatır
5. Kalan öğrenciler sıradaki tercihlerine ve GPA'ya göre atanır
6. Admin atama sonuçlarını danışman bazlı Excel olarak indirebilir

## Proje Yapısı

```
bitirme-web/
├── backend/
│   ├── config/          # Veritabanı bağlantısı
│   ├── controllers/     # İş mantığı (admin, teacher, student, formConfig)
│   ├── middleware/       # Auth (JWT + Clerk)
│   ├── models/          # Mongoose şemaları
│   ├── routes/          # API endpoint tanımları
│   ├── seed/            # Admin seed
│   └── index.js         # Express sunucu + cascade zamanlayıcı
└── frontend/
    └── src/
        ├── components/  # AuthGate, Skeleton
        ├── pages/
        │   ├── admin/   # Dashboard, TeachersPage, FormSettings, Students, AssignedStudents
        │   ├── teacher/ # StudentApprovalPage, ProfilePage
        │   ├── public/  # FormPage (öğrenci formu)
        │   ├── layouts/ # AdminLayout, TeacherLayout
        │   └── components/ # ProtectedRoute
        ├── services/    # Axios instance + interceptors
        └── types/       # TypeScript interface tanımları
```

## API Endpoints

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/admin/login` | - | Admin girişi |
| GET | `/api/admin/dashboard` | Admin | Dashboard verileri |
| POST | `/api/admin/cascade` | Admin | Otomatik atama tetikle |
| GET | `/api/admin/assigned` | Admin | Atama sonuçları |
| GET/POST/PUT/DELETE | `/api/teachers/*` | Admin | Danışman CRUD |
| POST | `/api/teachers/login` | - | Danışman girişi |
| GET | `/api/teachers/my-students` | Teacher | Öğrenci listesi |
| POST | `/api/teachers/finalize` | Teacher | Öğrenci onaylama |
| PUT | `/api/teachers/profile` | Teacher | Profil güncelleme |
| GET/POST | `/api/students/*` | Clerk | Öğrenci form işlemleri |
| GET/PUT | `/api/form/*` | Public/Admin | Form yapılandırması |
