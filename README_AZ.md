# FitnessProject — Backend + Frontend

Bu paketdə ASP.NET Core Web API backend-i və React frontend-i birlikdədir.

## Qovluqlar

- `Backend/FitnessProject.sln` — Visual Studio 2022 solution-u (.NET 8)
- `Frontend/` — React + Vite tətbiqi

## İlk dəfə işə salma

### 1. Backend

1. Visual Studio 2022 ilə `Backend/FitnessProject.sln` faylını aç.
2. NuGet paketlərinin restore olunmasını gözlə.
3. `Backend/FitnessProject.API/appsettings.json` faylında SQL Server bağlantısını yoxla. Standart konfiqurasiya LocalDB istifadə edir.
4. `Tools → NuGet Package Manager → Package Manager Console` aç.
5. `Default project` olaraq `FitnessProject.Infrastructure` seç və migration hələ yaradılmayıbsa bu əmrləri sırayla icra et:

   ```powershell
   Add-Migration InitialCreate -Project FitnessProject.Infrastructure -StartupProject FitnessProject.API -OutputDir Data/Migrations
   Update-Database -Project FitnessProject.Infrastructure -StartupProject FitnessProject.API
   ```

   Əgər `Data/Migrations` qovluğunda migration artıq varsa, `Add-Migration` əmri ilə eyni migration-ı yenidən yaratma; yalnız `Update-Database` işlət.

6. `FitnessProject.API` layihəsini Startup Project et və `F5` bas.
7. Swagger `https://localhost:7292/swagger` ünvanında açılmalıdır.
8. Backend ilk dəfə başladıqda demo üçün 12 nümunə məşq avtomatik yaradılır. Mövcud eyni slug-a malik məşqlər təkrar əlavə edilmir. Məşqlər `GET /api/Workouts` endpoint-ində və frontend-də görünməlidir.

### 2. Frontend

1. Node.js LTS quraşdırılmış olmalıdır.
2. Visual Studio Code-da `Frontend` qovluğunu aç.
3. Terminalda bu əmrləri işlət:

   ```bash
   npm install
   npm run dev
   ```

4. Brauzerdə `http://localhost:5173` ünvanını aç.

Frontend-in API ünvanı `Frontend/.env.example` faylında göstərilib: `https://localhost:7292/api`. Portun fərqlidirsə, `Frontend/.env` faylı yarat və `VITE_API_URL` dəyərini düzəlt. `.env` dəyişəndən sonra Vite serverini yenidən başlat.

## Admin hesabı

Standart lokal demo hesabı `Backend/FitnessProject.API/appsettings.json` faylında göstərilib:

- Email: `admin@fitnessproject.local`
- Password: `Admin123!Change`

Bu məlumatlar yalnız lokal test üçündür. Təqdimat üçün dəyişə bilərsən. Real yayımlamada standart admin şifrəsini və JWT açarını mütləq dəyiş.

## Email və Cloudinary

Real email OTP üçün `Email:Smtp` bölməsinə Gmail SMTP məlumatlarını daxil et. Gmail-in adi parolunu yox, Google App Password istifadə et. SMTP qurulmayıbsa Development rejimində test üçün `developmentOtp` qaytarıla bilər.

Profil şəkilləri, aylıq fotolar və məşq media faylları üçün Cloudinary məlumatlarını `Cloudinary` bölməsinə daxil et. Fayllar layihənin içində saxlanmır; verilənlər bazasında yalnız media URL-ləri saxlanılır.

## Əgər xəta çıxsa

- Backend açılmırsa, əvvəlcə `Backend/FitnessProject.API`-nin `appsettings.json` və Output pəncərəsini yoxla.
- Frontend API-yə qoşulmursa, `https://localhost:7292/swagger` brauzerdə açıldığını və portun `.env`-də düzgün yazıldığını yoxla.
- Migration və build problemləri üçün xətanın tam mətnini saxla.

Qeyd: Bu paketdə upload endpoint-lərinin `IFormFile` parametrləri əvvəlki Swagger `500` problemi üçün atributsuz saxlanılıb. Paket bu mühitdə .NET SDK və Node dependency install ilə tam build testindən keçirilməyib; öz kompüterində restore/build yoxlaması et.
