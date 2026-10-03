-- ============================================================
-- Tabel foto proyek MOVE (multiple foto, maks 5 per proyek)
-- ============================================================
CREATE TABLE IF NOT EXISTS `move_proyek_foto` (
  `id`         INT(11) NOT NULL AUTO_INCREMENT,
  `proyek_id`  INT(11) NOT NULL,
  `gambar`     VARCHAR(255) NOT NULL,
  `urutan`     INT(11) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_proyek_foto_proyek` (`proyek_id`),
  FOREIGN KEY (`proyek_id`) REFERENCES `move_proyek`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrasikan foto lama dari kolom gambar ke tabel baru
INSERT INTO `move_proyek_foto` (`proyek_id`, `gambar`, `urutan`)
SELECT `id`, `gambar`, 0 FROM `move_proyek`
WHERE `gambar` IS NOT NULL AND `gambar` != '';

SELECT 'Tabel move_proyek_foto berhasil dibuat!' AS hasil;
