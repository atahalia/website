-- Tambah kolom Twitter/X dan Threads di move_proyek
ALTER TABLE `move_proyek`
  ADD COLUMN IF NOT EXISTS `link_twitter` VARCHAR(500) DEFAULT NULL AFTER `link_facebook`,
  ADD COLUMN IF NOT EXISTS `link_threads` VARCHAR(500) DEFAULT NULL AFTER `link_twitter`;

SELECT 'Kolom Twitter dan Threads berhasil ditambahkan!' AS hasil;
