-- Fix warna 4 jurusan MOVE agar berbeda jelas di peta
-- TKJ   = Biru    #1a56db
-- TPTUP = Cyan    #0891b2
-- Boga  = Hijau   #059669
-- TKR   = Merah   #dc2626

UPDATE move_program SET
  warna1 = '#1a56db',
  warna2 = '#f59e0b',
  warna_light = '#eff6ff',
  gradient = 'linear-gradient(135deg,#1e3a5f 0%,#1a56db 100%)'
WHERE slug = 'tkj';

UPDATE move_program SET
  warna1 = '#0891b2',
  warna2 = '#22d3ee',
  warna_light = '#ecfeff',
  gradient = 'linear-gradient(135deg,#164e63 0%,#0891b2 100%)'
WHERE slug = 'tptup';

UPDATE move_program SET
  warna1 = '#059669',
  warna2 = '#fbbf24',
  warna_light = '#ecfdf5',
  gradient = 'linear-gradient(135deg,#064e3b 0%,#059669 100%)'
WHERE slug = 'boga';

UPDATE move_program SET
  warna1 = '#dc2626',
  warna2 = '#fbbf24',
  warna_light = '#fff1f2',
  gradient = 'linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)'
WHERE slug = 'tkr';

SELECT slug, nama, warna1, warna2 FROM move_program ORDER BY urutan ASC;
