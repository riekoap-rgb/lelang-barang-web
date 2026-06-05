CREATE DATABASE IF NOT EXISTS db_lelang;
USE db_lelang;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS barang_lelang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_barang VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    harga_awal DECIMAL(15, 2) NOT NULL,
    harga_sekarang DECIMAL(15, 2) NOT NULL,
    tanggal_mulai DATETIME NOT NULL,
    tanggal_selesai DATETIME NOT NULL,
    status ENUM('aktif', 'selesai', 'ditutup') NOT NULL DEFAULT 'aktif',
    pemenang_id INT NULL,
    FOREIGN KEY (pemenang_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tawaran_lelang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barang_id INT NOT NULL,
    user_id INT NOT NULL,
    jumlah_tawaran DECIMAL(15, 2) NOT NULL,
    waktu_tawaran DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barang_id) REFERENCES barang_lelang(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed data
INSERT IGNORE INTO users (id, username, password, role) VALUES
(1, 'admin', 'admin123', 'admin'),
(2, 'budi', 'budi123', 'user'),
(3, 'ani', 'ani123', 'user');

INSERT IGNORE INTO barang_lelang (id, nama_barang, deskripsi, harga_awal, harga_sekarang, tanggal_mulai, tanggal_selesai, status) VALUES
(1, 'Lukisan Kuno Dinasti Tang', 'Lukisan tinta asli dari era Dinasti Tang, bersertifikat keaslian dan dalam kondisi terawat.', 5000000.00, 5000000.00, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'aktif'),
(2, 'Jam Tangan Klasik Omega 1960', 'Jam tangan mekanik vintage Omega Seamaster, dial original dengan strap kulit buaya.', 3000000.00, 3000000.00, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 'aktif'),
(3, 'Vespa VBB 1964 Restorasi', 'Vespa Klasik VBB 150cc tahun 1964 warna biru telur asin, full restorasi part original, surat lengkap.', 15000000.00, 15000000.00, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 'aktif');
