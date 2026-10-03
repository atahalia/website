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
      program, proyek: null, fotos: [],
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
      const { judul, deskripsi, tahun, tanggal_pelaksanaan, lokasi, status, featured,
              jumlah_siswa, jumlah_item, satuan_item, nama_pelanggan, kategori_pelanggan,
              link_maps, link_publikasi } = req.body;
      const gambar = req.file ? req.file.filename : null;
      await db.query(
        `INSERT INTO move_proyek
          (program_id,judul,deskripsi,tahun,tanggal_pelaksanaan,lokasi,gambar,status,featured,
           jumlah_siswa,jumlah_item,satuan_item,nama_pelanggan,kategori_pelanggan,link_maps,link_publikasi)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [pid, judul, deskripsi||'', tahun||new Date().getFullYear(),
         tanggal_pelaksanaan||null, lokasi||'', gambar,
         status||'published', featured==='1'?1:0,
         jumlah_siswa||null, jumlah_item||null, satuan_item||'Unit',
         nama_pelanggan||null, kategori_pelanggan||'Lainnya',
         link_maps||null, link_publikasi||null]
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
    const [[rows], [fotos]] = await Promise.all([
      db.query('SELECT * FROM move_proyek WHERE id=? AND program_id=?', [req.params.pid, program.id]),
      db.query('SELECT * FROM move_proyek_foto WHERE proyek_id=? ORDER BY urutan ASC, id ASC', [req.params.pid])
    ]);
    if (!rows.length) return res.redirect(`/admin/move/${program.id}/proyek`);
    res.render('admin/move/proyek-form', {
      title: 'Edit Proyek – ' + program.nama,
      user: req.session,
      program, proyek: rows[0], fotos,
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
      const { judul, deskripsi, tahun, tanggal_pelaksanaan, lokasi, status, featured,
              jumlah_siswa, jumlah_item, satuan_item, nama_pelanggan, kategori_pelanggan,
              link_maps, link_publikasi } = req.body;
      const gambar = req.file ? req.file.filename : null;
      const baseFields = [judul, deskripsi||'', tahun, tanggal_pelaksanaan||null, lokasi||'',
                          status||'published', featured==='1'?1:0,
                          jumlah_siswa||null, jumlah_item||null, satuan_item||'Unit',
                          nama_pelanggan||null, kategori_pelanggan||'Lainnya',
                          link_maps||null, link_publikasi||null];
      if (gambar) {
        await db.query(
          `UPDATE move_proyek SET judul=?,deskripsi=?,tahun=?,tanggal_pelaksanaan=?,lokasi=?,
           status=?,featured=?,jumlah_siswa=?,jumlah_item=?,satuan_item=?,
           nama_pelanggan=?,kategori_pelanggan=?,link_maps=?,link_publikasi=?,gambar=?
           WHERE id=? AND program_id=?`,
          [...baseFields, gambar, pid, id]
        );
      } else {
        await db.query(
          `UPDATE move_proyek SET judul=?,deskripsi=?,tahun=?,tanggal_pelaksanaan=?,lokasi=?,
           status=?,featured=?,jumlah_siswa=?,jumlah_item=?,satuan_item=?,
           nama_pelanggan=?,kategori_pelanggan=?,link_maps=?,link_publikasi=?
           WHERE id=? AND program_id=?`,
          [...baseFields, pid, id]
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

exports.pelangganEdit = async (req, res) => {
  try {
    const klid = req.params.klid;
    const { nama, alamat, layanan, tahun, lat, lng, keterangan } = req.body;
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      const [rows] = await db.query('SELECT program_id FROM move_pelanggan WHERE id=?', [klid]);
      const pid = rows.length ? rows[0].program_id : '';
      return res.redirect(`/admin/move/${pid}/pelanggan?error=Koordinat+tidak+valid`);
    }
    const [rows] = await db.query('SELECT program_id FROM move_pelanggan WHERE id=?', [klid]);
    if (!rows.length) return res.redirect('/admin/move');
    await db.query(
      'UPDATE move_pelanggan SET nama=?, alamat=?, layanan=?, tahun=?, lat=?, lng=?, keterangan=? WHERE id=?',
      [nama, alamat||'', layanan||'', tahun||new Date().getFullYear(), parseFloat(lat), parseFloat(lng), keterangan||'', klid]
    );
    clearMoveCache();
    res.redirect(`/admin/move/${rows[0].program_id}/pelanggan?success=1`);
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

// ── API: semua pelanggan untuk peta publik ────────────────────────────
exports.apiPelanggan = async (req, res) => {
  try {
    // Tidak pakai cache agar titik baru langsung tampil
    const [rows] = await db.query(`
      SELECT k.id, k.nama, k.alamat, k.layanan, k.tahun,
             k.lat, k.lng, k.keterangan,
             p.slug as program_slug, p.nama as program_nama, p.warna1
      FROM move_pelanggan k
      JOIN move_program p ON p.id = k.program_id
      WHERE p.status = 'aktif'
      ORDER BY k.tahun DESC, k.id ASC
    `);
    // Set header agar tidak di-cache browser
    res.set('Cache-Control', 'no-store');
    res.json(rows);
  } catch (err) {
    console.error('API pelanggan error:', err);
    res.status(500).json({ error: 'Gagal memuat data' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// FOTO PROYEK (multiple, maks 5)
// ═══════════════════════════════════════════════════════════════════════

const uploadFotoProyek = createUpload('move-proyek').array('foto_baru', 5);

/**
 * POST /admin/move/:id/proyek/:pid/foto/upload
 * Upload 1–5 foto baru untuk proyek, simpan ke move_proyek_foto
 */
exports.proyekFotoUpload = (req, res) => {
  const { id, pid } = req.params;
  uploadFotoProyek(req, res, async (err) => {
    if (err) return res.redirect(`/admin/move/${id}/proyek/${pid}/edit?error=${encodeURIComponent(err.message)}`);
    try {
      // Cek total foto yang sudah ada
      const [[countRow]] = await db.query('SELECT COUNT(*) as cnt FROM move_proyek_foto WHERE proyek_id=?', [pid]);
      const existing = countRow.cnt;
      const files = req.files || [];
      const sisa = Math.max(0, 5 - existing);
      const toInsert = files.slice(0, sisa);

      for (let i = 0; i < toInsert.length; i++) {
        // Compress setiap file
        req.file = toInsert[i];
        await compressImage(req, res, () => {});
        await db.query(
          'INSERT INTO move_proyek_foto (proyek_id, gambar, urutan) VALUES (?,?,?)',
          [pid, toInsert[i].filename, existing + i]
        );
      }

      // Update gambar utama di move_proyek jika belum ada
      const [proyek] = await db.query('SELECT gambar FROM move_proyek WHERE id=?', [pid]);
      if (proyek.length && !proyek[0].gambar && toInsert.length > 0) {
        await db.query('UPDATE move_proyek SET gambar=? WHERE id=?', [toInsert[0].filename, pid]);
      }

      clearMoveCache();
      const msg = toInsert.length < files.length
        ? `${toInsert.length} foto diupload (batas 5 foto per proyek)`
        : `${toInsert.length} foto berhasil diupload`;
      res.redirect(`/admin/move/${id}/proyek/${pid}/edit?success=1&msg=${encodeURIComponent(msg)}`);
    } catch (e) { console.error(e); res.status(500).send('Terjadi kesalahan'); }
  });
};

/**
 * POST /admin/move/:id/proyek/:pid/foto/:fid/delete
 * Hapus satu foto proyek
 */
exports.proyekFotoDelete = async (req, res) => {
  const { id, pid, fid } = req.params;
  try {
    await db.query('DELETE FROM move_proyek_foto WHERE id=? AND proyek_id=?', [fid, pid]);
    // Jika foto yang dihapus adalah gambar utama, ganti ke foto berikutnya
    const [proyek] = await db.query('SELECT gambar FROM move_proyek WHERE id=?', [pid]);
    if (proyek.length) {
      const [[fotoRow]] = await db.query('SELECT gambar FROM move_proyek_foto WHERE proyek_id=? ORDER BY urutan ASC, id ASC LIMIT 1', [pid]);
      await db.query('UPDATE move_proyek SET gambar=? WHERE id=?', [fotoRow ? fotoRow.gambar : null, pid]);
    }
    clearMoveCache();
    res.redirect(`/admin/move/${id}/proyek/${pid}/edit?success=1`);
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};
