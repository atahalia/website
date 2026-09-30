-- ============================================================
-- Fix: Perbaiki jurusan program MOVE
-- Hapus Tata Busana, perbaiki nama TPTUP
-- 4 jurusan benar: TKJ, TPTUP, Kuliner, TKR
-- ============================================================

-- 1. Hapus program Tata Busana beserta semua data terkait (CASCADE)
DELETE FROM move_program WHERE slug = 'busana';

-- 2. Update TPTUP: nama yang benar
UPDATE move_program SET
  nama = 'Teknik Pemanasan, Tata Udara, dan Pendinginan',
  deskripsi_singkat = 'Layanan servis AC, instalasi pendingin ruangan, dan pelatihan refrigerasi gratis untuk komunitas dan UMKM sekitar.',
  hero_title = 'Solusi Pendingin<br>untuk Komunitas Anda',
  hero_sub = 'Tim TPTUP SMKN 1 Kras siap memberikan layanan servis AC, instalasi sistem pendingin, dan pelatihan refrigerasi gratis untuk komunitas, UMKM, masjid, dan lembaga pendidikan.',
  hero_card_title = 'Servis AC & Pendingin Gratis',
  hero_card_desc = 'Dari servis AC rumahan hingga instalasi cold storage – kami hadir untuk komunitas Anda.',
  icon = 'fas fa-snowflake',
  gradient = 'linear-gradient(135deg,#0c4a6e 0%,#0ea5e9 100%)',
  warna1 = '#0c4a6e',
  warna2 = '#38bdf8',
  warna_light = '#f0f9ff',
  urutan = 2
WHERE slug = 'tptup';

-- 3. Hapus layanan lama TPTUP (tentang jahit/tekstil), ganti dengan layanan AC/pendingin
DELETE FROM move_layanan WHERE program_id = (SELECT id FROM move_program WHERE slug = 'tptup');

-- 4. Insert layanan TPTUP yang benar (AC & pendingin)
INSERT INTO move_layanan (program_id, icon, nama, deskripsi, urutan)
SELECT p.id, l.icon, l.nama, l.deskripsi, l.urutan
FROM move_program p
JOIN (
  SELECT 'fas fa-snowflake'          icon, 'Servis AC Rumahan'              nama, 'Pembersihan, pengisian freon, dan servis ringan unit AC split untuk rumah tangga secara gratis.',     1 urutan UNION ALL
  SELECT 'fas fa-wind'                    , 'Instalasi AC & Pendingin'      , 'Pemasangan unit AC dan sistem ventilasi untuk masjid, mushola, posyandu, dan kantor kecil.',             2 UNION ALL
  SELECT 'fas fa-tools'                   , 'Perawatan Berkala AC'          , 'Program perawatan rutin unit AC untuk lembaga pendidikan dan sosial agar tetap efisien dan awet.',        3 UNION ALL
  SELECT 'fas fa-chalkboard-teacher'      , 'Pelatihan Dasar Refrigerasi'   , 'Workshop dasar sistem pendingin, komponen AC, dan K3 untuk masyarakat yang ingin belajar teknisi.',      4 UNION ALL
  SELECT 'fas fa-store'                   , 'Konsultasi Cold Storage UMKM'  , 'Pendampingan pemilihan dan perawatan cold storage untuk UMKM makanan/minuman agar produk tetap segar.', 5 UNION ALL
  SELECT 'fas fa-leaf'                    , 'Hemat Energi & Freon Ramah Lingkungan', 'Edukasi penggunaan AC hemat energi dan freon ramah lingkungan untuk komunitas.',                  6
) l WHERE p.slug = 'tptup';

-- 5. Update urutan program: TKJ=1, TPTUP=2, Kuliner(boga)=3, TKR=4
UPDATE move_program SET urutan = 1 WHERE slug = 'tkj';
UPDATE move_program SET urutan = 2 WHERE slug = 'tptup';
UPDATE move_program SET urutan = 3 WHERE slug = 'boga';
UPDATE move_program SET urutan = 4 WHERE slug = 'tkr';

-- 6. Nonaktifkan program lain jika ada (busana sudah dihapus)
UPDATE move_program SET status = 'nonaktif'
WHERE slug NOT IN ('tkj','tptup','boga','tkr');

-- Verifikasi
SELECT id, slug, nama, urutan, status FROM move_program ORDER BY urutan ASC;
