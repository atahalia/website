-- Tabel anggota tim proyek MOVE
-- Setiap proyek bisa punya maks 4 anggota (siswa), masing-masing punya 1 link publikasi
CREATE TABLE IF NOT EXISTS `move_proyek_anggota` (
  `id`             INT(11) NOT NULL AUTO_INCREMENT,
  `proyek_id`      INT(11) NOT NULL,
  `nama`           VARCHAR(200) NOT NULL,
  `link_publikasi` VARCHAR(500) DEFAULT NULL,
  `urutan`         INT(11) DEFAULT 0,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_anggota_proyek` (`proyek_id`),
  FOREIGN KEY (`proyek_id`) REFERENCES `move_proyek`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabel move_proyek_anggota berhasil dibuat!' AS hasil;
