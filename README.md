# Sistem Manajemen Rental Oksigen - Backend REST API

Ini adalah backend REST API berbasis **NestJS** untuk **Sistem Manajemen Rental Oksigen**. Aplikasi ini menggunakan **Prisma ORM** untuk pemetaan database PostgreSQL (Supabase), dilengkapi sistem kontrol akses berbasis peran (RBAC/Role-Based Access Control), serta **Stock Movement Engine** terpusat sebagai satu-satunya sumber kebenaran (Single Source of Truth) untuk inventaris barang dan tabung gas oksigen.

---

## 🏗️ Arsitektur Sistem & Alur Kerja

Berikut adalah visualisasi alur request client saat melewati berbagai layer di NestJS hingga melakukan query ke database PostgreSQL:

```mermaid
graph TD
    Client[HTTP Client / Postman / Dashboard] -->|Kirim Request| Route[Route Handlers]
    Route --> Guard{Auth & Roles Guards}
    Guard -->|Tidak Sah| Deny[401 / 403 Response]
    Guard -->|Sah| Pipe[Validation Pipe]
    Pipe -->|Data Tidak Valid| BadRequest[400 Bad Request]
    Pipe --> Controller[Controllers Layer]
    
    subgraph NestJS Backend Layer
        Controller --> Service[Services / Logika Bisnis]
        Service --> Validation[Validasi Bisnis / Cek Stok & Status]
        Validation --> Repository[Repositories / Layer Akses Data]
        Repository --> Prisma[Prisma Client ORM]
    end

    Prisma -->|Pooled / Session Connections| Postgres[(PostgreSQL / Supabase)]
    
    Postgres -->|Kembalikan Data| Prisma
    Prisma -->|Entities / Objek Data| Repository
    Repository -->|DTOs / Data| Service
    Service -->|Response Interceptor| Response[Format JSON Terpadu]
    Response --> Client
```

---

## 📊 Model Data & Relasi Database (ERD)

Database dirancang dengan normalisasi tingkat tinggi untuk mencegah inkonsistensi data transaksi, keuangan, dan stok tabung. Berikut adalah ERD lengkap beserta tipe data dan foreign key constraint:

```mermaid
erDiagram
    Role ||--o{ User : "memiliki"
    User ||--o{ Rental : "membuat"
    User ||--o{ Sale : "membuat"
    User ||--o{ CustomerRefill : "membuat"
    User ||--o{ Purchase : "membuat"
    User ||--o{ Expense : "mencatat"
    User ||--o{ Income : "mencatat"
    User ||--o{ StockMovement : "mencatat"
    User ||--o{ ActivityLog : "mencatat"
    
    Customer ||--o{ Rental : "menyewa"
    Customer ||--o{ Sale : "membeli"
    Customer ||--o{ CustomerRefill : "melakukan isi ulang"
    Customer ||--o{ Cylinder : "memegang (jika disewa)"
    
    Vendor ||--o{ Purchase : "menyuplai"
    Vendor ||--o{ Cylinder : "memegang (jika dikirim untuk isi ulang)"
    
    Category ||--o{ Product : "memiliki"
    
    Product ||--o{ SaleItem : "bagian dari"
    Product ||--o{ PurchaseItem : "bagian dari"
    Product ||--o{ StockMovement : "memiliki riwayat"
    
    OxygenType ||--o{ Cylinder : "mengisi"
    
    Cylinder ||--o{ RentalItem : "disewa dalam"
    Cylinder ||--o{ StockMovement : "memiliki riwayat"
    
    Rental ||--o{ RentalItem : "memiliki item"
    Sale ||--o{ SaleItem : "memiliki item"
    CustomerRefill ||--o{ CustomerRefillItem : "memiliki item"
    Purchase ||--o{ PurchaseItem : "memiliki item"

    User {
        uuid id PK
        string email UK
        string passwordHash "password_hash"
        string fullName "full_name"
        uuid roleId FK "role_id"
        boolean isActive "is_active"
        string refreshTokenHash "refresh_token_hash"
        string fcmToken "fcm_token"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    Role {
        uuid id PK
        enum name UK "OWNER, ADMIN, FINANCE, WAREHOUSE"
        string description
        datetime createdAt
        datetime updatedAt
    }
    Customer {
        uuid id PK
        string name
        string phone
        string email
        string address
        decimal balance
        boolean isActive "is_active"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    Vendor {
        uuid id PK
        string name
        string phone
        string email
        string address
        boolean isActive "is_active"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    Category {
        uuid id PK
        string name UK
        string description
        boolean isActive "is_active"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    Product {
        uuid id PK
        string name
        string sku UK
        string description
        uuid categoryId FK "category_id"
        decimal price
        decimal cost
        int currentStock "current_stock"
        int minStock "min_stock"
        boolean isActive "is_active"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    OxygenType {
        uuid id PK
        string name UK
        decimal purity
        decimal pressure
        string description
        decimal pricePerUnit "price_per_unit"
        boolean isActive "is_active"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    Cylinder {
        uuid id PK
        string serialNumber UK "serial_number"
        decimal capacity
        string size
        enum status "AVAILABLE, RENTED, AT_VENDOR, MAINTENANCE, EMPTY"
        uuid oxygenTypeId FK "oxygen_type_id"
        uuid customerId FK "customer_id"
        uuid vendorId FK "vendor_id"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    Rental {
        uuid id PK
        string invoiceNo UK "invoice_no"
        uuid customerId FK "customer_id"
        datetime startDate "start_date"
        datetime dueDate "due_date"
        datetime returnDate "return_date"
        decimal totalAmount "total_amount"
        decimal amountPaid "amount_paid"
        string status "RENTING, RETURNED, OVERDUE"
        string notes
        uuid createdById FK "created_by_id"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    RentalItem {
        uuid id PK
        uuid rentalId FK "rental_id"
        uuid cylinderId FK "cylinder_id"
        decimal price
        datetime returnedAt "returned_at"
        datetime createdAt
        datetime updatedAt
    }
    Sale {
        uuid id PK
        string invoiceNo UK "invoice_no"
        uuid customerId FK "customer_id"
        decimal totalAmount "total_amount"
        decimal amountPaid "amount_paid"
        string paymentMethod "payment_method"
        enum status "PAID, UNPAID, PARTIAL"
        uuid createdById FK "created_by_id"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    SaleItem {
        uuid id PK
        uuid saleId FK "sale_id"
        uuid productId FK "product_id"
        int quantity
        decimal unitPrice "unit_price"
        decimal subtotal
        datetime createdAt
        datetime updatedAt
    }
    CustomerRefill {
        uuid id PK
        string invoiceNo UK "invoice_no"
        uuid customerId FK "customer_id"
        decimal totalAmount "total_amount"
        decimal amountPaid "amount_paid"
        string paymentMethod "payment_method"
        enum status "PAID, UNPAID, PARTIAL"
        string notes
        uuid createdById FK "created_by_id"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    CustomerRefillItem {
        uuid id PK
        uuid refillId FK "refill_id"
        string cylinderSize "cylinder_size"
        int quantity
        decimal unitPrice "unit_price"
        decimal subtotal
        datetime createdAt
        datetime updatedAt
    }
    Purchase {
        uuid id PK
        string invoiceNo UK "invoice_no"
        uuid vendorId FK "vendor_id"
        decimal totalAmount "total_amount"
        decimal amountPaid "amount_paid"
        enum status "PAID, UNPAID, PARTIAL"
        uuid createdById FK "created_by_id"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    PurchaseItem {
        uuid id PK
        uuid purchaseId FK "purchase_id"
        uuid productId FK "product_id"
        int quantity
        decimal unitCost "unit_cost"
        decimal subtotal
        datetime createdAt
        datetime updatedAt
    }
    Expense {
        uuid id PK
        string category
        decimal amount
        datetime date
        string description
        uuid createdById FK "created_by_id"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    Income {
        uuid id PK
        string category
        decimal amount
        datetime date
        string description
        uuid createdById FK "created_by_id"
        enum referenceType "RENTAL, RETURN, VENDOR_REFILL, CUSTOMER_REFILL, SALE, PURCHASE"
        uuid referenceId "reference_id"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    StockMovement {
        uuid id PK
        enum type "IN, OUT, ADJUSTMENT"
        enum referenceType "RENTAL, RETURN, VENDOR_REFILL, CUSTOMER_REFILL, SALE, PURCHASE"
        uuid referenceId "reference_id"
        uuid productId FK "product_id"
        uuid cylinderId FK "cylinder_id"
        int quantity
        int beforeStock "before_stock"
        int afterStock "after_stock"
        uuid createdById FK "created_by_id"
        datetime createdAt
    }
    ActivityLog {
        uuid id PK
        uuid userId FK "user_id"
        string action
        string details
        string ipAddress "ip_address"
        datetime createdAt
    }
    CompanySetting {
        uuid id PK
        string key UK
        string value
        string description
        datetime updatedAt
    }
```

---

## 🛠️ Fitur & Stack Teknologi

* **Framework**: NestJS (v11) dengan arsitektur Modular & Repository Pattern.
* **Database & ORM**: PostgreSQL (Supabase) dengan Prisma ORM (v6).
* **Autentikasi**: JWT (Access Token & Refresh Token) menggunakan Passport.js.
* **Keamanan**: Helmet (HTTP headers protection), Throttler (Rate limiting), & ValidationPipe (XSS & payload validation).
* **Kinerja**: Gzip Compression untuk optimalisasi payload data.
* **Dokumentasi**: Swagger API Interactive docs terintegrasi secara otomatis.

---

## 📂 Arsitektur Direktori

Project ini dibagi berdasarkan modul fitur untuk skalabilitas tim dan kemudahan maintenance:

```
src/
├── auth/                  # Endpoint autentikasi (login, refresh token, logout, ganti password)
├── users/                 # Manajemen pengguna (CRUD, Mapping Role, Status Aktif)
├── dashboard/             # Agregasi data statistik dashboard (KPIs, grafik sewa aktif, dll)
├── inventory/             # Modul CRUD Customer, Vendor, Product, Tabung Gas (Cylinder), & OxygenType
├── transactions/          # Transaksi Sewa (Lease), Pengembalian, Isi Ulang, Penjualan, Restock, & StockMovement logs
├── finance/               # Laporan Keuangan (Income, Expense, Ringkasan Arus Kas/Cash Flow)
├── reports/               # API laporan kustom dengan rentang tanggal dan grafik historis
├── settings/              # Konfigurasi perusahaan (Key-Value settings store)
├── common/                # Filters, interceptors, decorators, guards, dan pagination DTOs global
├── config/                # Validasi schema variabel lingkungan (.env validation)
├── database/              # Global PrismaService container
└── main.ts                # Entrypoint aplikasi & inisialisasi middleware global
```

---

## ⚙️ Fitur Inti: Stock Movement Engine

Sistem ini didesain agar data stok fisik tidak pernah salah atau mengalami inkonsistensi:
* **Satu Sumber Kebenaran**: Setiap aksi fisik seperti Rental, Return, Sale, Restock, maupun Refill di vendor akan menulis riwayat pergerakan ke tabel `StockMovement`.
* **Validasi Stok Ketat**: Stok produk reguler tidak boleh kurang dari nol.
* **Aturan Status Tabung**: Tabung gas oksigen hanya bisa disewakan apabila sedang berstatus `AVAILABLE`. Status otomatis berubah menjadi `RENTED` setelah disewa, dan kembali `AVAILABLE` setelah dikembalikan.

---

## 🚀 Instalasi & Konfigurasi

### 1. Prasyarat
* Node.js (v18, v20, atau v22+)
* npm / npx

### 2. Mengatur File Lingkungan (.env)
Salin file contoh konfigurasi lingkungan:
```bash
cp .env.example .env
```
Isi variabel dengan detail koneksi Supabase Anda. Karena Supabase menggunakan koneksi IPv6, untuk jaringan lokal IPv4 gunakan konfigurasi Connection Pooler Supabase sebagai berikut:
```env
# Koneksi Transaction Pooler (Port 6543) untuk operasional runtime aplikasi
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Koneksi Session Pooler (Port 5432) untuk melakukan eksekusi migrasi tabel
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

PORT=3000
NODE_ENV=development
JWT_SECRET="generate-a-secure-random-key"
JWT_REFRESH_SECRET="generate-another-secure-random-key"
```

### 3. Menginstal Dependensi
```bash
npm install
```

### 4. Setup Database & Seeding
Jalankan migrasi untuk menyinkronkan database dengan schema Prisma:
```bash
npx prisma migrate dev
```

Jalankan seeder untuk mengisi data awal (Default roles, user Owner/Admin/Finance/Warehouse, settings perusahaan, dan contoh data inventaris awal):
```bash
npx prisma db seed
```

**Informasi Login User Seeder (Password untuk semua: `Password123!`):**
* **Owner**: `owner@medis24.com`
* **Admin**: `admin@medis24.com`
* **Finance**: `finance@medis24.com`
* **Warehouse**: `warehouse@medis24.com`

### 5. Pembersihan Data untuk Produksi (Production Database Cleanup)
Jika sistem ingin dipindahkan ke lingkungan produksi dan Anda perlu menghapus data transaksi uji coba/mock tetapi harus mempertahankan transaksi aktif/berjalan milik pelanggan tertentu (seperti **Itsna Nihayatul Fitria** dan **Fitria**), jalankan skrip pembersihan produksi:

```bash
# Menjalankan pembersihan data transaksi dengan menyisakan data Fitria & Itsna
npm run db:clean:prod
```

Skrip ini akan secara otomatis:
- Menghapus seluruh data pengeluaran (`Expense`), pembelian vendor (`Purchase`/`PurchaseItem`), dan log aktivitas (`ActivityLog`).
- Menghapus seluruh transaksi penyewaan (`Rental`/`RentalItem`), penjualan (`Sale`/`SaleItem`), isi ulang (`CustomerRefill`/`CustomerRefillItem`), riwayat pergerakan stok (`StockMovement`), dan pendapatan (`Income`) milik pelanggan selain Fitria & Itsna.
- Mengatur ulang (reset) status tabung oksigen (`Cylinder`) milik pelanggan/vendor lain menjadi `AVAILABLE` (Tersedia) dan menghapus link custodian-nya.
- Mengatur ulang (reset) saldo (`balance`) seluruh pelanggan lain menjadi `0.00`.
- Mempertahankan seluruh transaksi, status tabung, dan saldo yang berkaitan dengan pelanggan **Itsna Nihayatul Fitria** dan **Fitria**.

---

## 🏃 Menjalankan Aplikasi

```bash
# Mode development (live reload watch mode)
npm run start:dev

# Build versi produksi
npm run build

# Menjalankan versi produksi
npm run start:prod
```

Setelah aplikasi berjalan, buka dokumentasi Swagger interaktif di:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## 📬 Postman Collection

Kami telah menyediakan file Postman Collection siap pakai yang mencakup seluruh endpoint di root project Anda:
* **[postman_collection.json](./postman_collection.json)**

**Cara menggunakan:**
1. Buka Postman dan klik **Import**.
2. Pilih file `postman_collection.json` di root direktori ini.
3. Buat environment variable baru di Postman:
   * **Name**: `baseUrl`
   * **Value**: `http://localhost:3000`

---

## 🐳 Eksekusi dengan Docker

Untuk menjalankan seluruh backend API beserta container database PostgreSQL secara lokal menggunakan Docker:
```bash
# Build image
docker build -t oxygen-backend .

# Jalankan container di background
docker-compose up -d
```

---

## 🛠️ Perbaikan & Aturan Desain Database Terkini

Berikut adalah perbaikan dan penyesuaian yang baru saja diterapkan pada sisi Backend & Database:
1. **Penghapusan Kolom Email Supplier**: Sesuai dengan instruksi terbaru, pendaftaran/pembuatan data supplier baru (Vendor) kini **tidak memerlukan alamat email** (kolom email dihapus dari payload input form maupun response relevan).
2. **Pembersihan Data Aset dari Tabel Produk**: Tabung Oksigen yang awalnya terdaftar secara salah di tabel `products` (SKU `CYL-1M3` dan `CYL-6M3`) telah **dihapus permanen (hard delete) dari database**.
   * *Aturan Desain*: Seluruh tabung oksigen fisik (aset sirkulasi) **wajib disimpan hanya pada tabel `cylinders`** (bersama model tracking serial number, size, kapasitas, status sewa, dll) dan **tidak boleh dicampur ke dalam tabel `products`** (yang khusus untuk barang dagang retail sekali beli).
