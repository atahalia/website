-- Tambah kolom link sosmed tambahan di move_proyek
ALTER TABLE `move_proyek`
  ADD COLUMN IF NOT EXISTS `link_tiktok`   VARCHAR(500) DEFAULT NULL AFTER `link_publikasi`,
  ADD COLUMN IF NOT EXISTS `link_youtube`  VARCHAR(500) DEFAULT NULL AFTER `link_tiktok`,
  ADD COLUMN IF NOT EXISTS `link_facebook` VARCHAR(500) DEFAULT NULL AFTER `link_youtube`;

SELECT 'Kolom link sosmed berhasil ditambahkan!' AS hasil;
