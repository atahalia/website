-- ============================================================
-- Tabel untuk Program MOVE – Melayani Komunitas Via Edukasi
-- Jalankan di VPS: mysql -u user -p dbname < migrations/create_move_tables.sql
-- ============================================================

-- Tabel utama program per jurusan
CREATE TABLE IF NOT EXISTS `move_program` (
  `id`               INT(11) NOT NULL AUTO_INCREMENT,
  `slug`             VARCHAR(50) NOT NULL UNIQUE,
  `nama`             VARCHAR(100) NOT NULL,
  `deskripsi_singkat` TEXT,
  `hero_title`       VARCHAR(200),
  `hero_sub`         TEXT,
  `hero_card_title`  VARCHAR(200),
  `hero_card_desc`   TEXT,
  `icon`             VARCHAR(100) DEFAULT 'fas fa-graduation-cap',
  `gradient`         VARCHAR(200) DEFAULT 'linear-gradient(135deg,#1e3a5f 0%,#1a56db 100%)',
  `warna1`           VARCHAR(20)  DEFAULT '#1e3a5f',
  `warna2`           VARCHAR(20)  DEFAULT '#f59e0b',
  `warna_light`      VARCHAR(20)  DEFAULT '#eff6ff',
  `kontak_wa`        VARCHAR(20),
  `stat_penerima`    VARCHAR(20)  DEFAULT '0',
  `stat_layanan`     VARCHAR(20)  DEFAULT '0',
  `stat_relawan`     VARCHAR(20)  DEFAULT '0',
  `urutan`           INT(11)      DEFAULT 0,
  `status`           ENUM('aktif','nonaktif') DEFAULT 'aktif',
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_move_program_slug` (`slug`),
  INDEX `idx_move_program_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Layanan per program
CREATE TABLE IF NOT EXISTS `move_layanan` (
  `id`          INT(11) NOT NULL AUTO_INCREMENT,
  `program_id`  INT(11) NOT NULL,
  `icon`        VARCHAR(100) DEFAULT 'fas fa-star',
  `nama`        VARCHAR(200) NOT NULL,
  `deskripsi`   TEXT,
  `urutan`      INT(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_move_layanan_program` (`program_id`),
  FOREIGN KEY (`program_id`) REFERENCES `move_program`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media sosial per program
CREATE TABLE IF NOT EXISTS `move_sosmed` (
  `id`          INT(11) NOT NULL AUTO_INCREMENT,
  `program_id`  INT(11) NOT NULL UNIQUE,
  `instagram`   VARCHAR(255) DEFAULT '',
  `tiktok`      VARCHAR(255) DEFAULT '',
  `youtube`     VARCHAR(255) DEFAULT '',
  `facebook`    VARCHAR(255) DEFAULT '',
  `whatsapp`    VARCHAR(20)  DEFAULT '',
  `embed`       TEXT,
  PRIMARY KEY (`id`),
  INDEX `idx_move_sosmed_program` (`program_id`),
  FOREIGN KEY (`program_id`) REFERENCES `move_program`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Galeri kegiatan per program
CREATE TABLE IF NOT EXISTS `move_galeri` (
  `id`          INT(11) NOT NULL AUTO_INCREMENT,
  `program_id`  INT(11) NOT NULL,
  `gambar`      VARCHAR(255) NOT NULL,
  `judul`       VARCHAR(200),
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_move_galeri_program` (`program_id`),
  FOREIGN KEY (`program_id`) REFERENCES `move_program`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tim pengelola per program
CREATE TABLE IF NOT EXISTS `move_pengelola` (
  `id`          INT(11) NOT NULL AUTO_INCREMENT,
  `program_id`  INT(11) NOT NULL,
  `nama`        VARCHAR(200) NOT NULL,
  `jabatan`     VARCHAR(200),
  `foto`        VARCHAR(255),
  `urutan`      INT(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_move_pengelola_program` (`program_id`),
  FOREIGN KEY (`program_id`) REFERENCES `move_program`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed data awal 4 jurusan ──────────────────────────────────────────────────
INSERT INTO `move_program` (`slug`,`nama`,`deskripsi_singkat`,`hero_title`,`hero_sub`,`hero_card_title`,`hero_card_desc`,`icon`,`gradient`,`warna1`,`warna2`,`warna_light`,`kontak_wa`,`stat_penerima`,`stat_layanan`,`stat_relawan`,`urutan`) VALUES
('tkj','Teknik Komputer Jaringan','Layanan IT, jaringan komputer, dan pelatihan digital gratis untuk komunitas sekitar.','Solusi Digital<br>untuk Komunitas Anda','Tim TKJ SMKN 1 Kras siap membantu instalasi jaringan, pelatihan komputer, dan konsultasi IT gratis untuk komunitas, UMKM, dan lembaga pendidikan.','Layanan IT Gratis Siap Hadir','Dari setting WiFi hingga pelatihan komputer – kami datang ke lokasi Anda.','fas fa-network-wired','linear-gradient(135deg,#1e3a5f 0%,#1a56db 100%)','#1e3a5f','#f59e0b','#eff6ff','',  '200+','8','30',1),
('tkr','Teknik Kendaraan Ringan','Servis ringan, tune up, dan pelatihan otomotif gratis untuk komunitas sekitar.','Servis Kendaraan<br>Gratis untuk Komunitas','Tim TKR SMKN 1 Kras menghadirkan layanan perawatan kendaraan ringan, tune up, dan konsultasi otomotif gratis untuk masyarakat sekitar.','Bengkel Keliling Gratis','Tune up, cek berkala, dan ganti oli ringan – hadir langsung ke komunitas Anda.','fas fa-car','linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)','#7f1d1d','#fbbf24','#fff1f2','',  '150+','6','25',2),
('busana','Tata Busana','Pelatihan menjahit, sulam, dan fashion gratis untuk ibu-ibu PKK dan komunitas kreatif.','Mode & Kreatif<br>untuk Komunitas','Tim Tata Busana SMKN 1 Kras hadir dengan layanan menjahit, sulam, dan pelatihan fashion gratis untuk ibu-ibu PKK, komunitas, dan UMKM kreatif.','Pelatihan Menjahit Gratis','Dari pola dasar hingga busana jadi – kami ajarkan langsung di komunitas Anda.','fas fa-cut','linear-gradient(135deg,#4a1d96 0%,#7c3aed 100%)','#4a1d96','#f59e0b','#f5f3ff','',  '100+','7','20',3),
('boga','Tata Boga','Pelatihan memasak, pastry, dan pengembangan UMKM kuliner gratis untuk masyarakat.','Kuliner Lezat<br>untuk Komunitas','Tim Tata Boga SMKN 1 Kras berbagi resep, pelatihan memasak, dan pengembangan usaha kuliner UMKM secara gratis untuk masyarakat sekitar.','Workshop Masak Gratis','Masakan Indonesia, pastry, dan manajemen warung – hadir di komunitas Anda.','fas fa-utensils','linear-gradient(135deg,#064e3b 0%,#059669 100%)','#064e3b','#fbbf24','#ecfdf5','',  '180+','8','28',4);

-- Seed layanan TKJ
INSERT INTO `move_layanan` (`program_id`,`icon`,`nama`,`deskripsi`,`urutan`) VALUES
(1,'fas fa-wifi','Instalasi Jaringan WiFi','Setting dan instalasi jaringan WiFi untuk masjid, mushola, RT/RW, dan UMKM secara gratis.',1),
(1,'fas fa-laptop','Pelatihan Komputer Dasar','Belajar mengoperasikan komputer, Ms. Office, dan internet untuk masyarakat umum.',2),
(1,'fas fa-shield-alt','Keamanan Perangkat','Pembersihan virus, instal ulang OS, dan penguatan keamanan perangkat secara gratis.',3),
(1,'fas fa-print','Servis Printer & Komputer','Perbaikan ringan printer dan komputer untuk warga yang membutuhkan.',4),
(1,'fas fa-globe','Pembuatan Akun Digital UMKM','Bantu UMKM punya akun Google Bisnis, media sosial, dan kehadiran digital dasar.',5),
(1,'fas fa-chalkboard-teacher','Literasi Digital Lansia','Pelatihan khusus untuk warga lansia agar bisa menggunakan smartphone dengan aman.',6);

-- Seed layanan TKR
INSERT INTO `move_layanan` (`program_id`,`icon`,`nama`,`deskripsi`,`urutan`) VALUES
(2,'fas fa-oil-can','Ganti Oli & Filter','Layanan ganti oli dan filter kendaraan ringan secara gratis untuk warga sekitar sekolah.',1),
(2,'fas fa-car-battery','Cek Aki & Kelistrikan','Pemeriksaan kondisi aki dan sistem kelistrikan kendaraan secara gratis.',2),
(2,'fas fa-tachometer-alt','Tune Up Ringan','Servis tune up ringan meliputi busi, filter udara, dan karburator untuk kendaraan komunitas.',3),
(2,'fas fa-tools','Cek & Pompa Ban','Pemeriksaan tekanan ban dan tambal ban ringan secara gratis di lingkungan komunitas.',4),
(2,'fas fa-chalkboard-teacher','Pelatihan Perawatan Motor','Edukasi cara merawat sepeda motor sendiri agar tetap prima dan irit bahan bakar.',5),
(2,'fas fa-wrench','Konsultasi Otomotif','Tanya jawab gratis seputar masalah kendaraan ringan dengan siswa dan guru TKR.',6);

-- Seed layanan Busana
INSERT INTO `move_layanan` (`program_id`,`icon`,`nama`,`deskripsi`,`urutan`) VALUES
(3,'fas fa-cut','Pelatihan Menjahit Dasar','Belajar pola dasar, cara menjahit, dan membuat busana sederhana untuk pemula.',1),
(3,'fas fa-tshirt','Modifikasi & Repair Pakaian','Perbaikan pakaian rusak dan modifikasi busana lama menjadi tampilan baru.',2),
(3,'fas fa-feather-alt','Pelatihan Sulam & Bordir','Teknik sulam tangan dan bordir untuk kreasi kerajinan dan busana daerah.',3),
(3,'fas fa-shopping-bag','Pembuatan Tas & Aksesoris','Workshop membuat tas kain, dompet, dan aksesoris fashion dari bahan daur ulang.',4),
(3,'fas fa-store','Konsultasi UMKM Busana','Bimbingan pengembangan usaha fashion rumahan, dari produksi hingga pemasaran.',5),
(3,'fas fa-palette','Desain Batik & Kain Jumputan','Pelatihan membuat batik tulis sederhana dan teknik jumputan untuk komunitas.',6);

-- Seed layanan Boga
INSERT INTO `move_layanan` (`program_id`,`icon`,`nama`,`deskripsi`,`urutan`) VALUES
(4,'fas fa-utensils','Pelatihan Memasak Dasar','Workshop memasak masakan Indonesia sehari-hari yang praktis, lezat, dan hemat biaya.',1),
(4,'fas fa-birthday-cake','Workshop Pastry & Kue','Belajar membuat kue kering, brownies, dan aneka pastry untuk konsumsi atau usaha.',2),
(4,'fas fa-store','Konsultasi UMKM Kuliner','Pendampingan pengembangan usaha kuliner: menu, harga, packaging, dan pemasaran.',3),
(4,'fas fa-leaf','Pelatihan Olahan Sayur & Herbal','Cara mengolah sayuran lokal dan tanaman herbal menjadi produk bernilai jual.',4),
(4,'fas fa-bread-slice','Pelatihan Roti & Bakery','Teknik dasar pembuatan roti tawar, roti manis, dan produk bakery rumahan.',5),
(4,'fas fa-mug-hot','Barista & Minuman Kekinian','Pelatihan membuat kopi, minuman kekinian, dan teknik presentasi untuk UMKM.',6);

-- Seed sosmed (kosong, diisi lewat admin)
INSERT INTO `move_sosmed` (`program_id`,`instagram`,`tiktok`,`youtube`,`facebook`,`whatsapp`,`embed`) VALUES
(1,'','','','','',''),(2,'','','','','',''),
(3,'','','','','',''),(4,'','','','','','');

SELECT 'Tabel MOVE berhasil dibuat dan data awal telah diisi!' AS hasil;
