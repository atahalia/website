-- ============================================================
-- Migration: Proyek, Berita, Pelanggan untuk Program MOVE
-- + Tambah jurusan TPTUP sebagai program ke-5
-- Jalankan: mysql -u root -p dbname < migrations/add_move_proyek_berita_pelanggan.sql
-- ============================================================

-- Tambah TPTUP ke move_program (jika belum ada)
INSERT INTO `move_program`
  (`slug`,`nama`,`deskripsi_singkat`,`hero_title`,`hero_sub`,`hero_card_title`,`hero_card_desc`,
   `icon`,`gradient`,`warna1`,`warna2`,`warna_light`,`kontak_wa`,
   `stat_penerima`,`stat_layanan`,`stat_relawan`,`urutan`,`status`)
VALUES
  ('tptup','Teknik dan Produk Tekstil Umum','Layanan jahit, reparasi tekstil, dan pelatihan produk tekstil gratis untuk komunitas sekitar.',
   'Tekstil Kreatif<br>untuk Komunitas Anda',
   'Tim TPTUP SMKN 1 Kras siap memberikan layanan jahit, reparasi tekstil, pembuatan seragam, dan pelatihan produk tekstil gratis untuk komunitas, lembaga, dan UMKM.',
   'Layanan Tekstil Gratis Siap Hadir',
   'Dari jahit seragam hingga reparasi kain – kami hadir untuk komunitas Anda.',
   'fas fa-tshirt',
   'linear-gradient(135deg,#92400e 0%,#f59e0b 100%)',
   '#92400e','#fbbf24','#fffbeb','','200+','10','35',5,'aktif')
ON DUPLICATE KEY UPDATE `nama`=VALUES(`nama`);

-- Seed sosmed untuk TPTUP
INSERT INTO `move_sosmed` (`program_id`,`instagram`,`tiktok`,`youtube`,`facebook`,`whatsapp`,`embed`)
SELECT id,'','','','','','' FROM `move_program` WHERE slug='tptup'
ON DUPLICATE KEY UPDATE `instagram`=`instagram`;

-- Seed layanan TPTUP
INSERT INTO `move_layanan` (`program_id`,`icon`,`nama`,`deskripsi`,`urutan`)
SELECT p.id,l.icon,l.nama,l.deskripsi,l.urutan FROM `move_program` p
JOIN (
  SELECT 'fas fa-cut'              icon,'Jahit Seragam & Pakaian'      nama,'Pembuatan seragam sekolah, kaos komunitas, dan pakaian kerja secara gratis untuk lembaga dan organisasi.'   deskripsi,1 urutan UNION ALL
  SELECT 'fas fa-tools'                ,'Reparasi & Permak Pakaian'   ,'Memperbaiki pakaian rusak, memperpanjang atau memperpendek ukuran, dan modifikasi desain pakaian.'            ,2 UNION ALL
  SELECT 'fas fa-tshirt'               ,'Sablon & Print Kaos'         ,'Layanan sablon manual dan digital printing untuk kaos komunitas, organisasi, dan event.'                       ,3 UNION ALL
  SELECT 'fas fa-chalkboard-teacher'   ,'Pelatihan Menjahit Dasar'    ,'Workshop menjahit untuk pemula – dari mengenal mesin jahit hingga membuat produk sederhana.'                   ,4 UNION ALL
  SELECT 'fas fa-shopping-bag'         ,'Pembuatan Produk Tekstil'    ,'Membuat tas kain, dompet, aksesoris, dan produk tekstil bernilai jual dari bahan daur ulang.'                  ,5 UNION ALL
  SELECT 'fas fa-store'                ,'Konsultasi UMKM Tekstil'     ,'Pendampingan usaha konveksi rumahan – dari produksi, penetapan harga, hingga pemasaran produk.'                ,6
) l WHERE p.slug='tptup'
ON DUPLICATE KEY UPDATE `nama`=VALUES(`nama`);

-- ── Tabel Proyek MOVE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `move_proyek` (
  `id`          INT(11) NOT NULL AUTO_INCREMENT,
  `program_id`  INT(11) NOT NULL,
  `judul`       VARCHAR(255) NOT NULL,
  `deskripsi`   TEXT,
  `tahun`       YEAR NOT NULL DEFAULT 2025,
  `lokasi`      VARCHAR(255),
  `gambar`      VARCHAR(255),
  `status`      ENUM('published','draft') DEFAULT 'published',
  `featured`    TINYINT(1) DEFAULT 0,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_move_proyek_program` (`program_id`),
  INDEX `idx_move_proyek_tahun`   (`tahun`),
  INDEX `idx_move_proyek_status`  (`status`),
  FOREIGN KEY (`program_id`) REFERENCES `move_program`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel Berita MOVE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `move_berita` (
  `id`          INT(11) NOT NULL AUTO_INCREMENT,
  `program_id`  INT(11) NOT NULL,
  `judul`       VARCHAR(255) NOT NULL,
  `slug`        VARCHAR(255) NOT NULL,
  `ringkasan`   VARCHAR(500),
  `konten`      LONGTEXT,
  `gambar`      VARCHAR(255),
  `tampil_beranda` TINYINT(1) DEFAULT 1,
  `status`      ENUM('published','draft') DEFAULT 'published',
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  INDEX `idx_move_berita_program`  (`program_id`),
  INDEX `idx_move_berita_status`   (`status`),
  INDEX `idx_move_berita_beranda`  (`tampil_beranda`,`status`,`created_at`),
  FOREIGN KEY (`program_id`) REFERENCES `move_program`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel Pelanggan/Lokasi MOVE (untuk peta) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `move_pelanggan` (
  `id`          INT(11) NOT NULL AUTO_INCREMENT,
  `program_id`  INT(11) NOT NULL,
  `nama`        VARCHAR(255) NOT NULL,
  `alamat`      VARCHAR(500),
  `layanan`     VARCHAR(255),
  `tahun`       YEAR NOT NULL DEFAULT 2025,
  `lat`         DECIMAL(10,7) NOT NULL,
  `lng`         DECIMAL(10,7) NOT NULL,
  `keterangan`  TEXT,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_move_pelanggan_program` (`program_id`),
  INDEX `idx_move_pelanggan_tahun`   (`tahun`),
  FOREIGN KEY (`program_id`) REFERENCES `move_program`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed contoh pelanggan (lokasi sekitar Kras, Kediri)
INSERT INTO `move_pelanggan` (`program_id`,`nama`,`alamat`,`layanan`,`tahun`,`lat`,`lng`,`keterangan`)
SELECT p.id,'Masjid Al-Hidayah Kras','Kras, Kediri','Instalasi Jaringan WiFi',2025,-7.8234567,112.0123456,'Jaringan WiFi untuk masjid'
FROM move_program p WHERE p.slug='tkj' LIMIT 1;

INSERT INTO `move_pelanggan` (`program_id`,`nama`,`alamat`,`layanan`,`tahun`,`lat`,`lng`,`keterangan`)
SELECT p.id,'SDN Kras 1','Kras, Kediri','Pelatihan Komputer Dasar',2025,-7.8198765,112.0156789,'Lab komputer untuk siswa SD'
FROM move_program p WHERE p.slug='tkj' LIMIT 1;

INSERT INTO `move_pelanggan` (`program_id`,`nama`,`alamat`,`layanan`,`tahun`,`lat`,`lng`,`keterangan`)
SELECT p.id,'UMKM Bu Sari','Rejoso, Kediri','Jahit Seragam & Pakaian',2024,-7.8267890,112.0089012,'Seragam untuk karyawan UMKM batik'
FROM move_program p WHERE p.slug='tptup' LIMIT 1;

INSERT INTO `move_pelanggan` (`program_id`,`nama`,`alamat`,`layanan`,`tahun`,`lat`,`lng`,`keterangan`)
SELECT p.id,'Karang Taruna Desa Kras','Kras, Kediri','Pembuatan Produk Tekstil',2024,-7.8312345,112.0201234,'Seragam karang taruna dan aksesoris event'
FROM move_program p WHERE p.slug='tptup' LIMIT 1;

SELECT 'Migration proyek/berita/pelanggan MOVE berhasil!' AS hasil;
