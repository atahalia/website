-- ============================================================
-- Performance Indexes untuk Website SMKN 1 Kras
-- Jalankan sekali di VPS: mysql -u user -p sekolah_db < add_performance_indexes.sql
-- ============================================================

-- berita: query WHERE status="published" ORDER BY created_at DESC
ALTER TABLE `berita`
  ADD INDEX IF NOT EXISTS `idx_berita_status_created` (`status`, `created_at`);

-- artikel: query WHERE status="published" AND tampil_home=1
ALTER TABLE `artikel`
  ADD INDEX IF NOT EXISTS `idx_artikel_status_tampil_home` (`status`, `tampil_home`, `created_at`);

-- alumni: query WHERE status='disetujui'
ALTER TABLE `alumni`
  ADD INDEX IF NOT EXISTS `idx_alumni_status` (`status`);

-- galeri: ORDER BY created_at DESC
ALTER TABLE `galeri`
  ADD INDEX IF NOT EXISTS `idx_galeri_created` (`created_at`);

-- bkk_lowongan: WHERE status='aktif' ORDER BY created_at DESC
ALTER TABLE `bkk_lowongan`
  ADD INDEX IF NOT EXISTS `idx_bkk_status_created` (`status`, `created_at`);

-- file_download: WHERE status='aktif' AND tampil_home=1
ALTER TABLE `file_download`
  ADD INDEX IF NOT EXISTS `idx_file_download_status_home` (`status`, `tampil_home`, `created_at`);

-- agenda: WHERE status='aktif' AND tampil_home=1 AND tanggal_mulai
ALTER TABLE `agenda`
  ADD INDEX IF NOT EXISTS `idx_agenda_status_home_tgl` (`status`, `tampil_home`, `tanggal_mulai`);

-- profil_konten: WHERE tipe='sambutan'
ALTER TABLE `profil_konten`
  ADD INDEX IF NOT EXISTS `idx_profil_konten_tipe` (`tipe`);

-- media_sosial: WHERE status='aktif'
ALTER TABLE `media_sosial`
  ADD INDEX IF NOT EXISTS `idx_media_sosial_status` (`status`);

-- slider: WHERE status='aktif'
ALTER TABLE `slider`
  ADD INDEX IF NOT EXISTS `idx_slider_status` (`status`);

-- link_terkait: WHERE status='aktif'
ALTER TABLE `link_terkait`
  ADD INDEX IF NOT EXISTS `idx_link_terkait_status` (`status`);

-- jurusan: WHERE status='aktif'
ALTER TABLE `jurusan`
  ADD INDEX IF NOT EXISTS `idx_jurusan_status` (`status`);

-- fasilitas: WHERE status='published'
ALTER TABLE `fasilitas`
  ADD INDEX IF NOT EXISTS `idx_fasilitas_status` (`status`);

SELECT 'Indexes berhasil ditambahkan!' AS hasil;
