/**
 * moveContentController.js
 * Mengelola Proyek, Berita, dan Pelanggan/Peta untuk program MOVE.
 *
 * Routes yang ditangani:
 *  --- PROYEK ---
 *  GET  /admin/move/:id/proyek               → daftar proyek
 *  GET  /admin/move/:id/proyek/create        → form tambah
 *  POST /admin/move/:id/proyek/create        → simpan
 *  GET  /admin/move/:id/proyek/:pid/edit     → form edit
 *  POST /admin/move/:id/proyek/:pid/edit     → update
 *  POST /admin/move/:id/proyek/:pid/delete   → hapus
 *
 *  --- BERITA ---
 *  GET  /admin/move/:id/berita               → daftar berita
 *  GET  /admin/move/:id/berita/create        → form tambah
 *  POST /admin/move/:id/berita/create        → simpan
 *  GET  /admin/move/:id/berita/:bid/edit     → form edit
 *  POST /admin/move/:id/berita/:bid/edit     → update
 *  POST /admin/move/:id/berita/:bid/delete   → hapus
 *
 *  --- PELANGGAN/PETA ---
 *  GET  /admin/move/:id/pelanggan            → daftar + peta admin
 *  POST /admin/move/:id/pelanggan/add        → tambah titik
 *  POST /admin/move/pelanggan/:klid/delete   → hapus titik
 *
 *  --- API (untuk frontend peta) ---
 *  GET  /api/move/pelanggan                  → JSON semua pelanggan aktif
 */

const db      = require('../config/database');
const cache   = require('../utils/cache');
const { createUpload } = require('../middleware/uploadSecurity');
const compressImage    = require('../middleware/compressImage');

const uploadGambar = createUpload('move-content').single('gambar');

const clearMoveCache = () => cache.delByPrefix('move_');

// Slug sederhana
const makeSlug = (str) => str.toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  + '-' + Date.now();

// Helper: ambil program by id
async function getProgram(id) {
  const [rows] = await db.query('SELECT * FROM move_program WHERE id = ?', [id]);
  return rows[0] || null;
}

// Nav tab helper (dipakai di semua view)
const NAV_TABS = [
  { href: 'edit',      icon: 'fas fa-info-circle', label: 'Info',    cls: 'btn-outline-primary' },
  { href: 'layanan',   icon: 'fas fa-list-check',  label: 'Layanan', cls: 'btn-outline-success' },
  { href: 'proyek',    icon: 'fas fa-project-diagram', label: 'Proyek', cls: 'btn-outline-info' },
  { href: 'berita',    icon: 'fas fa-newspaper',   label: 'Berita',  cls: 'btn-outline-secondary' },
  { href: 'pelanggan', icon: 'fas fa-map-marker-alt', label: 'Peta', cls: 'btn-outline-warning' },
  { href: 'galeri',    icon: 'fas fa-images',      label: 'Galeri',  cls: 'btn-outline-warning' },
  { href: 'sosmed',    icon: 'fas fa-share-alt',   label: 'Sosmed',  cls: 'btn-outline-danger' },
  { href: 'pengelola', icon: 'fas fa-users',       label: 'Tim',     cls: 'btn-outline-secondary' },
];
exports.NAV_TABS = NAV_TABS;

// ═══════════════════════════════════════════════════════════════════════
// PROYEK
// ═══════════════════════════════════════════════════════════════════════

exports.proyekPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [proyek] = await db.query(
      'SELECT * FROM move_proyek WHERE program_id=? ORDER BY tahun DESC, id DESC',
      [program.id]
    );
    // Daftar tahun unik untuk filter
    const tahunList = [...new Set(proyek.map(p => p.tahun))].sort((a,b)=>b-a);
    res.render('admin/move/proyek', {
      title: 'Proyek – ' + program.nama,
      user: req.session,
      program, proyek, tahunList,
      csrfToken: req.session.csrfToken,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.proyekCreatePage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    res.render('admin/move/proyek-form', {
      title: 'Tambah Proyek – ' + program.nama,
      user: req.session,
      program, proyek: null,
      csrfToken: req.session.csrfToken,
      error: req.query.error
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.proyekCreate = (req, res) => {
  const pid = req.params.id;
  uploadGambar(req, res, async (err) => {
    if (err) return res.redirect(`/admin/move/${pid}/proyek/create?error=${encodeURIComponent(err.message)}`);
    await compressImage(req, res, () => {});
    try {
      const { judul, deskripsi, tahun, lokasi, status, featured } = req.body;
      const gambar = req.file ? req.file.filename : null;
      await db.query(
        'INSERT INTO move_proyek (program_id,judul,deskripsi,tahun,lokasi,gambar,status,featured) VALUES (?,?,?,?,?,?,?,?)',
        [pid, judul, deskripsi||'', tahun||new Date().getFullYear(), lokasi||'', gambar, status||'published', featured==='1'?1:0]
      );
      clearMoveCache();
      res.redirect(`/admin/move/${pid}/proyek?success=1`);
    } catch (e) { console.error(e); res.status(500).send('Terjadi kesalahan'); }
  });
};

exports.proyekEditPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [rows] = await db.query('SELECT * FROM move_proyek WHERE id=? AND program_id=?', [req.params.pid, program.id]);
    if (!rows.length) return res.redirect(`/admin/move/${program.id}/proyek`);
    res.render('admin/move/proyek-form', {
      title: 'Edit Proyek – ' + program.nama,
      user: req.session,
      program, proyek: rows[0],
      csrfToken: req.session.csrfToken,
      error: req.query.error
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.proyekUpdate = (req, res) => {
  const { id, pid } = req.params;
  uploadGambar(req, res, async (err) => {
    if (err) return res.redirect(`/admin/move/${id}/proyek/${pid}/edit?error=${encodeURIComponent(err.message)}`);
    await compressImage(req, res, () => {});
    try {
      const { judul, deskripsi, tahun, lokasi, status, featured } = req.body;
      const gambar = req.file ? req.file.filename : null;
      if (gambar) {
        await db.query(
          'UPDATE move_proyek SET judul=?,deskripsi=?,tahun=?,lokasi=?,gambar=?,status=?,featured=? WHERE id=? AND program_id=?',
          [judul, deskripsi||'', tahun, lokasi||'', gambar, status||'published', featured==='1'?1:0, pid, id]
        );
      } else {
        await db.query(
          'UPDATE move_proyek SET judul=?,deskripsi=?,tahun=?,lokasi=?,status=?,featured=? WHERE id=? AND program_id=?',
          [judul, deskripsi||'', tahun, lokasi||'', status||'published', featured==='1'?1:0, pid, id]
        );
      }
      clearMoveCache();
      res.redirect(`/admin/move/${id}/proyek?success=1`);
    } catch (e) { console.error(e); res.status(500).send('Terjadi kesalahan'); }
  });
};

exports.proyekDelete = async (req, res) => {
  try {
    const { id, pid } = req.params;
    await db.query('DELETE FROM move_proyek WHERE id=? AND program_id=?', [pid, id]);
    clearMoveCache();
    res.redirect(`/admin/move/${id}/proyek?success=1`);
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

// ═══════════════════════════════════════════════════════════════════════
// BERITA
// ═══════════════════════════════════════════════════════════════════════

exports.beritaPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [berita] = await db.query(
      'SELECT * FROM move_berita WHERE program_id=? ORDER BY created_at DESC',
      [program.id]
    );
    res.render('admin/move/berita', {
      title: 'Berita – ' + program.nama,
      user: req.session,
      program, berita,
      csrfToken: req.session.csrfToken,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.beritaCreatePage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    res.render('admin/move/berita-form', {
      title: 'Tulis Berita – ' + program.nama,
      user: req.session,
      program, berita: null,
      csrfToken: req.session.csrfToken,
      error: req.query.error
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.beritaCreate = (req, res) => {
  const pid = req.params.id;
  uploadGambar(req, res, async (err) => {
    if (err) return res.redirect(`/admin/move/${pid}/berita/create?error=${encodeURIComponent(err.message)}`);
    await compressImage(req, res, () => {});
    try {
      const { judul, ringkasan, konten, tampil_beranda, status } = req.body;
      const gambar = req.file ? req.file.filename : null;
      const slug = makeSlug(judul);
      await db.query(
        'INSERT INTO move_berita (program_id,judul,slug,ringkasan,konten,gambar,tampil_beranda,status) VALUES (?,?,?,?,?,?,?,?)',
        [pid, judul, slug, ringkasan||'', konten||'', gambar, tampil_beranda==='1'?1:0, status||'published']
      );
      clearMoveCache();
      res.redirect(`/admin/move/${pid}/berita?success=1`);
    } catch (e) { console.error(e); res.status(500).send('Terjadi kesalahan'); }
  });
};

exports.beritaEditPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [rows] = await db.query('SELECT * FROM move_berita WHERE id=? AND program_id=?', [req.params.bid, program.id]);
    if (!rows.length) return res.redirect(`/admin/move/${program.id}/berita`);
    res.render('admin/move/berita-form', {
      title: 'Edit Berita – ' + program.nama,
      user: req.session,
      program, berita: rows[0],
      csrfToken: req.session.csrfToken,
      error: req.query.error
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.beritaUpdate = (req, res) => {
  const { id, bid } = req.params;
  uploadGambar(req, res, async (err) => {
    if (err) return res.redirect(`/admin/move/${id}/berita/${bid}/edit?error=${encodeURIComponent(err.message)}`);
    await compressImage(req, res, () => {});
    try {
      const { judul, ringkasan, konten, tampil_beranda, status } = req.body;
      const gambar = req.file ? req.file.filename : null;
      if (gambar) {
        await db.query(
          'UPDATE move_berita SET judul=?,ringkasan=?,konten=?,gambar=?,tampil_beranda=?,status=? WHERE id=? AND program_id=?',
          [judul, ringkasan||'', konten||'', gambar, tampil_beranda==='1'?1:0, status||'published', bid, id]
        );
      } else {
        await db.query(
          'UPDATE move_berita SET judul=?,ringkasan=?,konten=?,tampil_beranda=?,status=? WHERE id=? AND program_id=?',
          [judul, ringkasan||'', konten||'', tampil_beranda==='1'?1:0, status||'published', bid, id]
        );
      }
      clearMoveCache();
      res.redirect(`/admin/move/${id}/berita?success=1`);
    } catch (e) { console.error(e); res.status(500).send('Terjadi kesalahan'); }
  });
};

exports.beritaDelete = async (req, res) => {
  try {
    const { id, bid } = req.params;
    await db.query('DELETE FROM move_berita WHERE id=? AND program_id=?', [bid, id]);
    clearMoveCache();
    res.redirect(`/admin/move/${id}/berita?success=1`);
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

// ═══════════════════════════════════════════════════════════════════════
// PELANGGAN / PETA
// ═══════════════════════════════════════════════════════════════════════

exports.pelangganPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [pelanggan] = await db.query(
      'SELECT * FROM move_pelanggan WHERE program_id=? ORDER BY tahun DESC, id DESC',
      [program.id]
    );
    // Semua program untuk peta gabungan
    const [allPrograms] = await db.query("SELECT id,slug,nama,warna1 FROM move_program WHERE status='aktif' ORDER BY urutan ASC");
    res.render('admin/move/pelanggan', {
      title: 'Peta Pelanggan – ' + program.nama,
      user: req.session,
      program, pelanggan, allPrograms,
      csrfToken: req.session.csrfToken,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.pelangganAdd = async (req, res) => {
  try {
    const pid = req.params.id;
    const { nama, alamat, layanan, tahun, lat, lng, keterangan } = req.body;
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return res.redirect(`/admin/move/${pid}/pelanggan?error=Koordinat+tidak+valid`);
    }
    await db.query(
      'INSERT INTO move_pelanggan (program_id,nama,alamat,layanan,tahun,lat,lng,keterangan) VALUES (?,?,?,?,?,?,?,?)',
      [pid, nama, alamat||'', layanan||'', tahun||new Date().getFullYear(), parseFloat(lat), parseFloat(lng), keterangan||'']
    );
    clearMoveCache();
    res.redirect(`/admin/move/${pid}/pelanggan?success=1`);
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.pelangganDelete = async (req, res) => {
  try {
    const klid = req.params.klid;
    const [rows] = await db.query('SELECT program_id FROM move_pelanggan WHERE id=?', [klid]);
    if (!rows.length) return res.redirect('/admin/move');
    await db.query('DELETE FROM move_pelanggan WHERE id=?', [klid]);
    clearMoveCache();
    res.redirect(`/admin/move/${rows[0].program_id}/pelanggan?success=1`);
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

// ── API: semua pelanggan untuk peta publik ────────────────────────────
exports.apiPelanggan = async (req, res) => {
  try {
    const cached = cache.get('move_pelanggan_api');
    if (cached) return res.json(cached);
    const [rows] = await db.query(`
      SELECT k.id, k.nama, k.alamat, k.layanan, k.tahun,
             k.lat, k.lng, k.keterangan,
             p.slug as program_slug, p.nama as program_nama, p.warna1
      FROM move_pelanggan k
      JOIN move_program p ON p.id = k.program_id
      WHERE p.status = 'aktif'
      ORDER BY k.tahun DESC, k.id ASC
    `);
    cache.set('move_pelanggan_api', rows, 300);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat data' });
  }
};
