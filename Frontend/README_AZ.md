# FitnessProject Frontend — React + Vite

Bu frontend hazır ASP.NET Core Web API backend-i ilə işləmək üçün hazırlanıb. Layihə ayrıca qovluqdadır; backend-in içindəki C# fayllarını dəyişmir.

## 1. Lazım olanlar

- Node.js (LTS)
- Visual Studio 2022-də işləyən `FitnessProject.API`
- Backend SQL Server migration-u tətbiq edilmiş olmalıdır.

## 2. Visual Studio Code-da açmaq

1. `FitnessProjectFrontend.zip` faylını çıxart.
2. Visual Studio Code-da **File → Open Folder** seç və `FitnessProjectFrontend` qovluğunu aç.
3. **Terminal → New Terminal** seç.
4. Paketləri quraşdır:

   ```bash
   npm install
   ```

5. Frontend-i başlad:

   ```bash
   npm run dev
   ```

6. Terminalda göstərilən ünvanı aç. Portu sabit saxlamaq üçün Vite `http://localhost:5173` istifadə edir.

## 3. Backend ilə əlaqə

Frontend `https://localhost:7292/api` ünvanına qoşulur. Bu ünvan backend-in `Properties/launchSettings.json` faylındakı HTTPS portuna uyğun seçilib.

1. Əvvəl Visual Studio 2022-də backend-i `F5` ilə başlat.
2. Brauzerdə `https://localhost:7292/swagger` səhifəsinin açıldığına əmin ol.
3. Sonra frontend-i `npm run dev` ilə başlad.

Backend portunu dəyişmisənsə, `FitnessProjectFrontend` qovluğunda `.env` adlı fayl yarat və ora yaz:

```env
VITE_API_URL=https://localhost:7292/api
```

`7292` hissəsini backend-in həqiqi portu ilə əvəz et. `.env` dəyişəndə Vite serverini dayandırıb yenidən başlat.

Backend-də `Program.cs` artıq `http://localhost:5173` CORS origin-ini icazəli sayır. Başqa host/port istifadə etsən, CORS parametrləri də uyğunlaşdırılmalıdır.

## 4. Admin panelinə giriş

Admin hesabı backend-in `FitnessProject.API/appsettings.json` faylındakı `Admin:Email` və `Admin:Password` parametrlərindən ilk startup zamanı yaradılır. Həmin məlumatlarla frontend-in giriş səhifəsindən login et. Adi `User` rolundakı istifadəçi Admin panelinə giriş edə bilməz.

Backend-də admin hesabının ilk yaradılması üçün migration tətbiq edilməli, `FitnessProject.API` ən azı bir dəfə başladılmalıdır.

## 5. Frontend funksiyaları

- Register, OTP email təsdiqi, Login və Logout
- Şəxsi icmal və gündəlik/həftəlik statistikalar
- Məşqlər siyahısı, slug ilə detallar, axtarış, əzələ qrupu, çətinlik və kateqoriya filtrləri
- Filtrlərin URL query parameter-lərində saxlanılması
- Həftəlik məşq planı; məşq əlavə etmə, tamamlama və silmə
- Tarixçə, profil redaktəsi və Cloudinary foto yükləmə
- Ümumi məşq tövsiyələri
- Admin məşq yaratma, redaktə, deaktiv etmə, şəkil/video yükləmə
- Admin istifadəçilərini görmək, rolunu və statusunu dəyişmək
- Skeleton/loading vəziyyətləri və mobil uyğun görünüş

## 6. Qeydlər

- İlk açılışda məşqlər boş görünə bilər. Admin panelindən məşqlər əlavə et.
- Email OTP real məktubla göndərilsin deyə backend `appsettings.json`-da SMTP məlumatları düzgün qurulmalıdır. SMTP qurulmayıbsa, Development rejimində backend test üçün `developmentOtp` qaytara bilər.
- Foto/video upload üçün backend-də Cloudinary məlumatları doldurulmalıdır.
- Brauzer API-yə qoşula bilmirsə, əvvəl `https://localhost:7292/swagger` aç. Developer sertifikatı xəbərdarlığı görünərsə, yerli ASP.NET Core HTTPS sertifikatını trust etmək lazım gələ bilər.
- Bu iş mühitində `npm install` şəbəkə səbəbindən vaxtında bitmədiyi üçün production build-i burada təsdiqləmək mümkün olmadı. Öz kompüterində `npm install` və `npm run build` ilə yoxla.
