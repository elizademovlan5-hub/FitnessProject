# FitnessProject — ASP.NET Core Web API (.NET 8)

Bu qovluqda backend yerləşir. Birləşdirilmiş paketdə frontend `../Frontend` qovluğundadır. Backend-i Visual Studio 2022-də `FitnessProject.sln` faylını açaraq başladın.

## Layihələr

- `FitnessProject.Domain` — istifadəçi və məşq entity-ləri.
- `FitnessProject.Application` — DTO-lar, interfeyslər və helper-lər.
- `FitnessProject.Infrastructure` — EF Core, SQL Server, JWT, email və Cloudinary servisləri.
- `FitnessProject.API` — controller-lər, Swagger, autentifikasiya və konfiqurasiya.

## İlk dəfə işə salma

1. Visual Studio 2022-də `FitnessProject.sln` açın.
2. NuGet paketlərinin restore olunmasını gözləyin. Solution üzərində sağ klik → **Restore NuGet Packages**.
3. SQL Server LocalDB quraşdırılmış olmalıdır. Əgər sizdə LocalDB yoxdursa, `FitnessProject.API/appsettings.json` içindəki `ConnectionStrings:DefaultConnection` dəyərini öz SQL Server instansiyanıza uyğunlaşdırın.
4. **Tools → NuGet Package Manager → Package Manager Console** açın. Bu iki əmri ardıcıl icra edin:

   ```powershell
   Add-Migration InitialCreate -Project FitnessProject.Infrastructure -StartupProject FitnessProject.API -OutputDir Data/Migrations
   Update-Database -Project FitnessProject.Infrastructure -StartupProject FitnessProject.API
   ```

5. Solution-u build edin: **Build → Build Solution**.
6. `FitnessProject.API` üzərində sağ klik → **Set as Startup Project**.
7. `F5` basın. Swagger `https://localhost:7292/swagger` ünvanında açılmalıdır.

`AppDbContextFactory` migration yaradılarkən appsettings faylını oxumağa kömək edir. Migration-dan əvvəl ilk dəfə API-ni başladmayın.

## Demo Admin

`appsettings.json`-da lokal təqdimat üçün demo admin konfiqurasiyası var:

- Email: `admin@fitnessproject.local`
- Password: `Admin123!Change`

İlk işə salmazdan əvvəl istəsəniz bu dəyərləri dəyişin. Bu, yalnız lokal demo üçündür; real deploy-da default şifrəni saxlamayın və JWT açarını dəyişin. Admin ilk startup zamanı avtomatik yaradılır.

## Email OTP

Qeydiyyat, email təsdiqi və login:

- `POST /api/Auth/register`
- `POST /api/Auth/verify-email`
- `POST /api/Auth/resend-otp`
- `POST /api/Auth/login`

Email-in real göndərilməsi üçün `appsettings.json` faylında `Email:Smtp:Username`, `Password` və `FromEmail` doldurulmalıdır. Gmail istifadə edilirsə, hesab üçün 2-Step Verification aktiv edib Gmail App Password yaradın; adi Gmail parolunu yazmayın.

Yalnız `Development` rejimində SMTP qurulmayıbsa test üçün OTP register cavabındakı `developmentOtp` sahəsində qaytarılır. Bu fallback production rejimində aktiv deyil.

## Cloudinary

Şəkil və video faylları server qovluğunda və SQL-də saxlanmır. Cloudinary hesabının `CloudName`, `ApiKey`, `ApiSecret` dəyərlərini `appsettings.json`-a daxil edin. SQL-də yalnız Cloudinary URL-i saxlanılır.

- Profil şəkli: `POST /api/Profile/photo` (`multipart/form-data`, `file`)
- Aylıq foto: `POST /api/Profile/monthly-photo` (`multipart/form-data`, `file`)
- Admin məşq şəkli: `POST /api/Admin/upload-image`
- Admin məşq videosu: `POST /api/Admin/upload-video`

Bu upload endpoint-ləri üçün JWT lazımdır. Admin media endpoint-ləri `Admin` rolu tələb edir. Aylıq progress foto hər istifadəçi üçün təqvim ayına bir dəfə qəbul olunur.

## Əsas API endpoint-ləri

### Auth (public)
- `POST /api/Auth/register`
- `POST /api/Auth/verify-email`
- `POST /api/Auth/resend-otp`
- `POST /api/Auth/login`

### Profil (JWT)
- `GET /api/Profile/me`
- `PUT /api/Profile/me`
- `POST /api/Profile/photo`
- `POST /api/Profile/monthly-photo`
- `GET /api/Profile/monthly-photos`

### Məşqlər (public, yalnız aktiv məşqlər)
- `GET /api/Workouts?search=push&muscleGroup=Chest&difficulty=Beginner&category=strength&page=1&pageSize=12`
- `GET /api/Workouts/{slug}`

Axtarış və filtrlər URL query parametrləri kimi verilir. Məşq detalları `id` yox, `slug` ilə açılır.

### Həftəlik plan (JWT)
- `GET /api/WeeklyPlan?weekStartDate=2026-10-12`
- `POST /api/WeeklyPlan/items` body nümunəsi: `{"workoutSlug":"push-up","dayOfWeek":1,"weekStartDate":"2026-10-12"}`
- `DELETE /api/WeeklyPlan/items/{workoutSlug}?weekStartDate=2026-10-12`
- `POST /api/WeeklyPlan/items/{workoutSlug}/complete?weekStartDate=2026-10-12`

`dayOfWeek` .NET qaydasındadır: Sunday=0, Monday=1, ... Saturday=6. `weekStartDate` veriləndə server onu həmin həftənin bazar ertəsinə normallaşdırır.

### Tövsiyələr (JWT)
- `GET /api/Recommendations/me` — profildə boy və çəki məlumatları olduqda ümumi başlanğıc məşq proqramı verir. Boy və çəki təkbaşına ideal bədən və ya tibbi məşq intensivliyi təyin etmək üçün istifadə edilmir.

### Statistikalar (JWT)
- `GET /api/Statistics/daily?date=2026-10-11`
- `GET /api/Statistics/weekly?weekStartDate=2026-10-12`
- `GET /api/Statistics/history?page=1&pageSize=20`

### Admin (yalnız Admin JWT)
- `GET /api/Admin/users`
- `PUT /api/Admin/users/role` body: `{"email":"user@example.com","role":"User"}`
- `PUT /api/Admin/users/status` body: `{"email":"user@example.com","isActive":false}`
- `GET /api/Admin/workouts`
- `POST /api/Admin/workouts`
- `GET /api/Admin/workouts/{slug}`
- `PUT /api/Admin/workouts/{slug}`
- `DELETE /api/Admin/workouts/{slug}` (soft delete: deactivate, existing history remains)
- `POST /api/Admin/upload-image`
- `POST /api/Admin/upload-video`

## Swagger-də JWT istifadə etmək

1. Login endpoint-indən token alın.
2. Swagger-də **Authorize** basın.
3. `Bearer ` sözünü, sonra token-i daxil edin. Məsələn: `Bearer eyJ...`.
4. Authorize edin.

## Fitness tövsiyələri barədə

`GET /api/Recommendations/me` profilin boy/çəki məlumatı tamamlandıqda ümumi başlanğıc proqramı qaytarır və istifadəçinin yazdığı məqsədə uyğun kateqoriyaya üstünlük verir. Boy və çəki məlumatlarından “ideal bədən” və ya arıqlama hədəfi hesablanmır. Google Sign-In ayrıca provider konfiqurasiyası tələb etdiyinə görə bu versiyaya daxil edilməyib.

## Qeydlər

- Məşq videosunun preview müddəti DTO/entity səviyyəsində `7–8` saniyə ilə məhdudlaşdırılır; videonun avtomatik oynadılması frontend funksiyasıdır.
- Bu source bundle bu mühitdə `dotnet build` ilə kompilyasiya testindən keçirilməyib, çünki .NET SDK quraşdırılmayıb. Öz Visual Studio 2022 mühitində build edib xətanın tam mətnini yoxlamaq lazımdır.
