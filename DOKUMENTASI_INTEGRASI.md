# Panduan Integrasi Backend (API & WebSocket) - Sistem Rental Oksigen

Dokumen ini memuat panduan lengkap bagi developer aplikasi client (**Next.js/Vite Dashboard** dan **Flutter Mobile**) untuk melakukan integrasi dengan backend REST API & WebSocket berbasis **NestJS**.

---

## ⚙️ 1. Konfigurasi Environment & Base URL

Setiap aplikasi client harus mendefinisikan URL backend sesuai dengan mode lingkungan (development / production).

### A. Lingkungan Pengembangan (Development / Lokal)
*   **Base URL REST API**: `http://localhost:3000`
*   **Base URL WebSocket**: `ws://localhost:3000`

> [!IMPORTANT]
> **Khusus Emulator Android (Flutter):**  
> Emulator Android tidak dapat mengenali `localhost` atau `127.0.0.1` sebagai mesin lokal Anda. Gunakan alamat IP **`http://10.0.2.2:3000`** (REST API) dan **`ws://10.0.2.2:3000`** (WebSocket) untuk menghubungkan emulator ke backend lokal.

### B. Lingkungan Produksi (Production / Live)
*   **Base URL REST API**: `https://api.oksigen24medis.com` (atau domain API yang dikonfigurasi)
*   **Base URL WebSocket**: `wss://api.oksigen24medis.com`

### C. Contoh Penerapan File `.env` di Client

**Next.js / React (Vite):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

**Flutter (`.env` / Dart Define):**
```dart
class AppConfig {
  static const String apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:3000');
  static const String wsUrl = String.fromEnvironment('WS_URL', defaultValue: 'ws://10.0.2.2:3000');
}
```

---

## 📦 2. Standardisasi Format Response & Error

Backend menggunakan interceptor dan filter global untuk memastikan semua response memiliki struktur JSON terpadu.

### A. Response Sukses (HTTP 200, 201, dll.)
Setiap request sukses akan dibungkus dengan format berikut. Data hasil query database akan selalu berada di dalam property **`data`**.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {
    // Payload data aktual ada di sini
  }
}
```

### B. Response Gagal / Error (HTTP 400, 401, 403, 500, dll.)
Setiap request yang gagal (misal: validasi input salah, token kedaluwarsa, atau error server) akan menghasilkan format error terpadu:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "messages": [
    "email must be a valid email",
    "password should not be empty"
  ],
  "error": "Bad Request",
  "timestamp": "2026-07-15T01:00:00.000Z",
  "path": "/auth/login"
}
```
*   **`message`**: Berisi ringkasan error utama (tipe string).
*   **`messages`**: Daftar detail error validasi (tipe array of string). Sangat berguna untuk memetakan pesan error pada form input di frontend.

---

## 🔑 3. Alur Autentikasi & Keamanan (JWT Flow)

Aplikasi menggunakan skema **Dual Token** (Access Token berumur pendek & Refresh Token berumur panjang) untuk menjaga keamanan sesi pengguna.

### A. Login User (`POST /auth/login`)
*   **URL**: `/auth/login`
*   **Request Body**:
    ```json
    {
      "email": "admin@medis24.com",
      "password": "Password123!"
    }
    ```
*   **Response Data**:
    ```json
    {
      "success": true,
      "statusCode": 200,
      "message": "Operation completed successfully",
      "data": {
        "user": {
          "id": "c62fb524-74d3-4632-a56e-8260a927fa11",
          "email": "admin@medis24.com",
          "fullName": "Admin Oksigen24",
          "roleId": "d7486e92-d6ef-466d-a19e-e2c72bdf29a1",
          "role": {
            "id": "d7486e92-d6ef-466d-a19e-e2c72bdf29a1",
            "name": "ADMIN" // OWNER, ADMIN, FINANCE, WAREHOUSE
          },
          "isActive": true
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

### B. Mengirim Request Terotentikasi
Untuk mengakses API yang membutuhkan login, kirimkan `accessToken` dalam header **`Authorization`** dengan skema **Bearer**:

```http
Authorization: Bearer <accessToken>
```

### C. Alur Refresh Token (`POST /auth/refresh`)
Jika client menerima response **`401 Unauthorized`** (karena `accessToken` sudah kedaluwarsa), client harus melakukan refresh token secara otomatis di background (menggunakan interceptor seperti Axios Interceptor di frontend atau HTTP interceptor di Flutter).

*   **URL**: `/auth/refresh`
*   **Headers**:
    ```http
    Authorization: Bearer <refreshToken>
    ```
*   **Response**: Mengembalikan `accessToken` dan `refreshToken` baru. Simpan kembali token baru tersebut ke penyimpanan lokal (`localStorage`, `SecureStore`, atau `flutter_secure_storage`).

### D. Logout (`POST /auth/logout`)
*   **URL**: `/auth/logout`
*   **Headers**: `Authorization: Bearer <accessToken>`
*   **Deskripsi**: Menghapus catatan refresh token dari database untuk menonaktifkan sesi saat ini.

---

## ⚡ 4. Sinkronisasi Real-time via WebSocket Gateway

Backend dilengkapi dengan WebSocket gateway untuk memberi tahu client jika ada data di database yang berubah (melalui operasi `POST`, `PUT`, `PATCH`, atau `DELETE`).

### A. Cara Koneksi
Hubungkan client ke websocket server pada root URL:
```javascript
// Contoh di Next.js / Browser
const ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {
  console.log("Terhubung ke Realtime Gateway");
};
```

### B. Pesan Welcome (Saat Pertama Terkoneksi)
Begitu koneksi berhasil dibentuk, backend akan mengirimkan payload penyambutan:
```json
{
  "event": "welcome",
  "payload": "Connected to Realtime Gateway"
}
```

### C. Event Perubahan Database (`db_change`)
Jika ada pengguna lain (atau aksi backend) yang menambah, memperbarui, atau menghapus data transaksi/inventaris, gateway akan menyiarkan event berikut ke seluruh client:

```json
{
  "event": "db_change",
  "payload": {
    "method": "POST",          // POST, PUT, PATCH, atau DELETE
    "url": "/transactions/rentals"  // Endpoint yang memicu perubahan
  }
}
```

### D. Strategi Implementasi di Client (Query Invalidation)
Gunakan event `db_change` ini untuk memperbarui UI secara real-time tanpa perlu melakukan polling manual ke server:
*   **Next.js (React Query / TanStack Query)**:
    ```javascript
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'db_change') {
        // Lakukan invalidasi cache query agar query client melakukan refetch otomatis
        queryClient.invalidateQueries(); 
      }
    };
    ```
*   **Flutter (Bloc/Cubit/Provider)**:
    Saat menerima event `db_change`, pemicu event fetch ulang pada controller/bloc yang sedang aktif untuk mengambil data terbaru dari REST API.

---

## 🛡️ 5. Hak Akses Modul Berdasarkan Role (RBAC)

Aplikasi memiliki kontrol akses berbasis peran (Role-Based Access Control) yang ketat. Pastikan UI menyembunyikan atau menonaktifkan tombol/modul jika peran user saat ini tidak memiliki akses.

| Modul | Endpoint Prefix | OWNER | ADMIN | FINANCE | WAREHOUSE | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Auth** | `/auth/*` | ✅ | ✅ | ✅ | ✅ | Semua user aktif bisa login, me, & ganti password. |
| **Users** | `/users/*` | ✅ | ❌ | ❌ | ❌ | Hanya OWNER yang dapat mengelola akun staff / user baru. |
| **Settings** | `/settings/*` | ✅ | ✅ | ❌ | ❌ | Pengaturan identitas perusahaan / toko medis. |
| **Inventory** | `/inventory/*` | ✅ | ✅ | ❌ | ✅ | CRUD Produk, Kategori, Tabung (Cylinder), Vendor, Customer. |
| **Sales / Rentals** | `/transactions/sales`, `/transactions/rentals` | ✅ | ✅ | ✅ | ❌ | Pencatatan transaksi jual-beli dan sewa tabung oksigen. |
| **Refills / Restocks** | `/transactions/purchases`, `/transactions/refills` | ✅ | ✅ | ❌ | ✅ | Restock produk dari vendor & pengiriman tabung isi ulang. |
| **Finance** | `/finance/*` | ✅ | ❌ | ✅ | ❌ | Pengeluaran, Pemasukan non-transaksi, Ringkasan Arus Kas. |
| **Reports** | `/reports/*` | ✅ | ❌ | ✅ | ❌ | Laporan statistik transaksi dan laba rugi. |
| **Dashboard** | `/dashboard/*` | ✅ | ✅ | ✅ | ✅ | Ringkasan statistik (KPI card disesuaikan dengan role). |

---

## 📬 6. Integrasi Menggunakan Postman

Kami menyertakan file Postman Collection siap pakai di root direktori project:
*   [postman_collection.json](file:///Users/nabilkencana/Project /oksigen24medis-backend/postman_collection.json)

### Langkah Impor & Setup:
1.  Buka aplikasi Postman.
2.  Klik tombol **Import** di kiri atas, pilih file `postman_collection.json`.
3.  Buat **Environment** baru di Postman dengan variabel berikut:
    *   `baseUrl` = `http://localhost:3000` (atau URL server production)
    *   `accessToken` = *(Akan terisi otomatis)*
    *   `refreshToken` = *(Akan terisi otomatis)*
4.  **Otomatisasi Token**: Folder collection sudah dikonfigurasi dengan script *Tests* di request login. Saat Anda memanggil `POST /auth/login`, token akan disimpan secara otomatis ke dalam Environment Postman Anda, sehingga request selanjutnya yang membutuhkan bearer token langsung berfungsi secara instan.

---

## 📖 7. Dokumentasi API Interaktif (Swagger UI)

Untuk melihat detail tipe data request, parameter query filter, skema response, dan mencoba API secara langsung, jalankan server backend lokal dan buka tautan berikut pada browser Anda:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

Dokumentasi Swagger ini selalu sinkron secara otomatis dengan setiap perubahan kode TypeScript di backend.
