-- ============================================================
-- Upgrade tabel move_proyek: tambah field detail lengkap
-- ============================================================

ALTER TABLE `move_proyek`
  ADD COLUMN IF NOT EXISTS `tanggal_pelaksanaan` DATE NULL AFTER `tahun`,
  ADD COLUMN IF NOT EXISTS `jumlah_siswa`    INT(11) DEFAULT NULL AFTER `tanggal_pelaksanaan`,
  ADD COLUMN IF NOT EXISTS `jumlah_item`     VARCHAR(100) DEFAULT NULL AFTER `jumlah_siswa`,
  ADD COLUMN IF NOT EXISTS `satuan_item`     VARCHAR(50)  DEFAULT 'Unit' AFTER `jumlah_item`,
  ADD COLUMN IF NOT EXISTS `nama_pelanggan`  VARCHAR(255) DEFAULT NULL AFTER `satuan_item`,
  ADD COLUMN IF NOT EXISTS `kategori_pelanggan` ENUM('Sekolah','Masjid/Mushola','Kantor/Instansi','UMKM','Rumah Tangga','Organisasi','Lainnya') DEFAULT 'Lainnya' AFTER `nama_pelanggan`,
  ADD COLUMN IF NOT EXISTS `link_maps`       VARCHAR(500) DEFAULT NULL AFTER `kategori_pelanggan`,
  ADD COLUMN IF NOT EXISTS `link_publikasi`  VARCHAR(500) DEFAULT NULL AFTER `link_maps`;

SELECT 'Upgrade tabel move_proyek berhasil!' AS hasil;
