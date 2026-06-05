# Sistem Lelang Barang

## Deskripsi
Sistem Lelang Barang adalah platform berbasis web yang memungkinkan pengguna untuk berpartisipasi dalam lelang online. Sistem ini menyediakan fitur pendaftaran, login, penjelajahan barang lelang, penawaran harga (bid), serta sistem notifikasi real-time.

## Teknologi yang Digunakan
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Flask (Python)
- **Database**: MySQL
- **Real-time Communication**: Socket.IO

## Fitur Utama
### 1. Autentikasi Pengguna
- **Registrasi**: Pengguna baru dapat membuat akun dengan role: **user** atau **admin**.
- **Login**: Login aman menggunakan username dan password.
- **Dashboard**: Halaman selamat datang yang disesuaikan berdasarkan role (Admin/User).

### 2. Manajemen Barang Lelang (Admin)
- **Tambah Barang**: Admin dapat menambahkan barang baru untuk dilelang.
  - Input: Nama Barang, Deskripsi, Harga Awal, Durasi (menit).
- **Tutup Lelang**: Admin dapat menutup lelang secara manual sebelum waktu berakhir.
- **Real-time Status**: Status barang (running/ended) dan harga tertinggi diperbarui secara real-time.

### 3. Partisipasi Lelang (User)
- **Daftar Lelang**: Melihat daftar barang yang sedang dilelang.
- **Penawaran (Bidding)**:
  - User dapat memberikan penawaran harga.
  - Penawaran harus lebih tinggi dari harga tertinggi saat ini.
  - Harga diperbarui secara real-time di semua client yang sedang melihat barang tersebut.
- **Pemenang**: Sistem akan menentukan pemenang secara otomatis setelah lelang berakhir.

## Struktur Proyek
```
Sistem-Lelang-Web/
├── frontend/          # Tampilan antarmuka pengguna
│   ├── index.html       # Halaman utama (Login/Register)
│   ├── user.html        # Dashboard user (Daftar Lelang)
│   ├── admin.html       # Dashboard admin (Manajemen Barang)
│   └── assets/          # File CSS dan JavaScript
└── backend/           # Logika server dan API
    └── app.py         # Aplikasi Flask utama
```

## Instalasi dan Konfigurasi

### Prasyarat
- Python 3.x
- MySQL Server
- Node.js (opsional, untuk menjalankan backend dengan npm)

### Backend Setup
1. Navigasi ke direktori backend:
   ```bash
   cd backend
   ```

2. Install dependensi:
   ```bash
   pip install flask flask-cors mysql-connector-python python-dotenv
   ```

3. Konfigurasi Environment Variable:
   Buat file `.env` di direktori `backend/` dengan konfigurasi database:
   ```ini
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=db_lelang
   ```

4. Import Database Schema:
   Gunakan file `db_lelang.sql` (atau skema yang setara) untuk membuat tabel yang diperlukan:
   ```sql
   CREATE TABLE users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(50) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL,
       role VARCHAR(20) DEFAULT 'user'
   );

   CREATE TABLE barang_lelang (
       id INT AUTO_INCREMENT PRIMARY KEY,
       nama_barang VARCHAR(255) NOT NULL,
       deskripsi TEXT,
       harga_awal INT DEFAULT 0,
       harga_sekarang INT DEFAULT 0,
       tanggal_mulai TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       tanggal_selesai TIMESTAMP,
       status VARCHAR(20) DEFAULT 'running',
       pemenang_id INT,
       FOREIGN KEY (pemenang_id) REFERENCES users(id)
   );

   CREATE TABLE tawaran_lelang (
       id INT AUTO_INCREMENT PRIMARY KEY,
       barang_id INT NOT NULL,
       user_id INT NOT NULL,
       jumlah_tawaran INT NOT NULL,
       waktu_tawaran TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (barang_id) REFERENCES barang_lelang(id),
       FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

### Frontend Setup
Tidak diperlukan instalasi khusus. File HTML dapat dibuka langsung di browser.

## Cara Menjalankan Aplikasi

### 1. Jalankan Backend
Buka terminal, navigasi ke direktori `backend`, dan jalankan aplikasi:
```bash
cd backend
python app.py
```
Server akan berjalan pada `http://localhost:5000`.

### 2. Akses Frontend
Buka browser Anda dan akses file berikut:
- **Login/Registrasi**: `file:///c:/Tubes%20CC/frontend/index.html`
- **User Dashboard**: `file:///c:/Tubes%20CC/frontend/user.html`
- **Admin Dashboard**: `file:///c:/Tubes%20CC/frontend/admin.html`

## Catatan
- Pastikan server MySQL berjalan sebelum menjalankan backend.
- Untuk mengubah durasi lelang secara default saat menambah barang, edit variabel `DEFAULT_DURASI_MINIT` di `app.py`.
- Aplikasi ini menggunakan Socket.IO untuk komunikasi real-time, sehingga perubahan harga akan langsung terlihat oleh user lain yang sedang membuka halaman lelang tersebut.
