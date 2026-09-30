/**
 * moveAdminController.js
 * Manajemen program MOVE (Melayani Komunitas Via Edukasi) di panel admin.
 *
 * Route yang ditangani:
 *  GET  /admin/move                    → index daftar program
 *  GET  /admin/move/:id/edit           → form edit program
 *  POST /admin/move/:id/edit           → simpan perubahan program
 *  GET  /admin/move/:id/layanan        → kelola layanan
 *  POST /admin/move/:id/layanan/add    → tambah layanan
 *  POST /admin/move/layanan/:lid/edit  → edit layanan
 *  POST /admin/move/layanan/:lid/delete→ hapus layanan
 *  GET  /admin/move/:id/sosmed         → form sosmed
 *  POST /admin/move/:id/sosmed         → simpan sosmed
 *  GET  /admin/move/:id/galeri         → kelola galeri
 *  POST /admin/move/:id/galeri/upload  → upload foto galeri
 *  POST /admin/move/galeri/:gid/delete → hapus foto galeri
 *  GET  /admin/move/:id/pengelola      → kelola pengelola
 *  POST /admin/move/:id/pengelola/add  → tambah pengelola
 *  POST /admin/move/pengelola/:pid/delete → hapus pengelola
 */

const db = require('../config/database');
const cache = require('../utils/cache');
const { createUpload } = require('../middleware/uploadSecurity');
const compressImage = require('../middleware/compressImage');

const uploadGaleri    = createUpload('move-galeri').single('gambar');
const uploadPengelola = createUpload('move-pengelola').single('foto');

// Invalidate semua cache MOVE
const clearMoveCache = () => {
  cache.delByPrefix('move_');
};

// ── Helper: ambil program by id (dengan validasi) ─────────────────────────────
async function getProgram(id) {
  const [rows] = await db.query('SELECT * FROM move_program WHERE id = ?', [id]);
  return rows[0] || null;
}

// Helper: ambil csrfToken dari req (di-inject oleh csrfMiddleware)
function csrf(req) {
  return req.csrfToken ? req.csrfToken() : (req.session.csrfToken || '');
}
// ── INDEX ─────────────────────────────────────────────────────────────────────
exports.index = async (req, res) => {
  try {
    const [programs] = await db.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM move_layanan WHERE program_id = p.id) as jml_layanan,
        (SELECT COUNT(*) FROM move_galeri  WHERE program_id = p.id) as jml_galeri,
        (SELECT COUNT(*) FROM move_pengelola WHERE program_id = p.id) as jml_pengelola,
        (SELECT COUNT(*) FROM move_proyek WHERE program_id = p.id AND status='published') as jml_proyek,
        (SELECT COUNT(*) FROM move_berita WHERE program_id = p.id AND status='published') as jml_berita,
        (SELECT COUNT(*) FROM move_pelanggan WHERE program_id = p.id) as jml_pelanggan
      FROM move_program p ORDER BY p.urutan ASC, p.id ASC
    `);
    res.render('admin/move/index', {
      title: 'Kelola Program MOVE',
      user: req.session,
      programs,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error('MOVE index error:', err);
    res.status(500).send('Terjadi kesalahan');
  }
};

// ── EDIT PROGRAM (info utama) ─────────────────────────────────────────────────
exports.editPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move?error=Program+tidak+ditemukan');
    res.render('admin/move/edit', {
      title: 'Edit Program MOVE – ' + program.nama,
      user: req.session,
      program,
      csrfToken: req.session.csrfToken,
      success: req.query.success,
      error: req.query.error,
      activeTab: req.query.tab || 'info'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.editSave = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      nama, deskripsi_singkat, hero_title, hero_sub,
      hero_card_title, hero_card_desc,
      icon, gradient, warna1, warna2, warna_light,
      kontak_wa,
      stat_penerima, stat_layanan, stat_relawan,
      urutan, status
    } = req.body;

    await db.query(`
      UPDATE move_program SET
        nama=?, deskripsi_singkat=?, hero_title=?, hero_sub=?,
        hero_card_title=?, hero_card_desc=?,
        icon=?, gradient=?, warna1=?, warna2=?, warna_light=?,
        kontak_wa=?,
        stat_penerima=?, stat_layanan=?, stat_relawan=?,
        urutan=?, status=?
      WHERE id=?`,
      [nama, deskripsi_singkat, hero_title, hero_sub,
       hero_card_title, hero_card_desc,
       icon, gradient, warna1, warna2, warna_light,
       kontak_wa || '',
       stat_penerima || '0', stat_layanan || '0', stat_relawan || '0',
       urutan || 0, status || 'aktif',
       id]
    );
    clearMoveCache();
    res.redirect(`/admin/move/${id}/edit?tab=info&success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

// ── LAYANAN ───────────────────────────────────────────────────────────────────
exports.layananPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [layanan] = await db.query(
      'SELECT * FROM move_layanan WHERE program_id = ? ORDER BY urutan ASC, id ASC',
      [program.id]
    );
    res.render('admin/move/layanan', {
      title: 'Layanan – ' + program.nama,
      user: req.session,
      program, layanan,
      csrfToken: req.session.csrfToken,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.layananAdd = async (req, res) => {
  try {
    const { icon, nama, deskripsi, urutan } = req.body;
    const pid = req.params.id;
    await db.query(
      'INSERT INTO move_layanan (program_id, icon, nama, deskripsi, urutan) VALUES (?,?,?,?,?)',
      [pid, icon || 'fas fa-star', nama, deskripsi || '', urutan || 0]
    );
    clearMoveCache();
    res.redirect(`/admin/move/${pid}/layanan?success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.layananEdit = async (req, res) => {
  try {
    const { icon, nama, deskripsi, urutan } = req.body;
    const lid = req.params.lid;
    const [rows] = await db.query('SELECT program_id FROM move_layanan WHERE id=?', [lid]);
    if (!rows.length) return res.redirect('/admin/move');
    await db.query(
      'UPDATE move_layanan SET icon=?, nama=?, deskripsi=?, urutan=? WHERE id=?',
      [icon || 'fas fa-star', nama, deskripsi || '', urutan || 0, lid]
    );
    clearMoveCache();
    res.redirect(`/admin/move/${rows[0].program_id}/layanan?success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.layananDelete = async (req, res) => {
  try {
    const lid = req.params.lid;
    const [rows] = await db.query('SELECT program_id FROM move_layanan WHERE id=?', [lid]);
    if (!rows.length) return res.redirect('/admin/move');
    await db.query('DELETE FROM move_layanan WHERE id=?', [lid]);
    clearMoveCache();
    res.redirect(`/admin/move/${rows[0].program_id}/layanan?success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

// ── SOSMED ────────────────────────────────────────────────────────────────────
exports.sosmedPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [rows] = await db.query(
      'SELECT * FROM move_sosmed WHERE program_id = ?', [program.id]
    );
    const sosmed = rows[0] || { instagram:'', tiktok:'', youtube:'', facebook:'', whatsapp:'', embed:'' };
    res.render('admin/move/sosmed', {
      title: 'Media Sosial – ' + program.nama,
      user: req.session,
      program, sosmed,
      csrfToken: req.session.csrfToken,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.sosmedSave = async (req, res) => {
  try {
    const pid = req.params.id;
    const { instagram, tiktok, youtube, facebook, whatsapp, embed } = req.body;
    await db.query(`
      INSERT INTO move_sosmed (program_id, instagram, tiktok, youtube, facebook, whatsapp, embed)
      VALUES (?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        instagram=VALUES(instagram), tiktok=VALUES(tiktok), youtube=VALUES(youtube),
        facebook=VALUES(facebook), whatsapp=VALUES(whatsapp), embed=VALUES(embed)`,
      [pid, instagram||'', tiktok||'', youtube||'', facebook||'', whatsapp||'', embed||'']
    );
    clearMoveCache();
    res.redirect(`/admin/move/${pid}/sosmed?success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

// ── GALERI ────────────────────────────────────────────────────────────────────
exports.galeriPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [galeri] = await db.query(
      'SELECT * FROM move_galeri WHERE program_id = ? ORDER BY created_at DESC',
      [program.id]
    );
    res.render('admin/move/galeri', {
      title: 'Galeri – ' + program.nama,
      user: req.session,
      program, galeri,
      csrfToken: req.session.csrfToken,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.galeriUpload = (req, res) => {
  const pid = req.params.id;
  uploadGaleri(req, res, async (err) => {
    if (err) return res.redirect(`/admin/move/${pid}/galeri?error=${encodeURIComponent(err.message)}`);
    await compressImage(req, res, () => {});
    try {
      if (!req.file) return res.redirect(`/admin/move/${pid}/galeri?error=File+tidak+ditemukan`);
      const { judul } = req.body;
      await db.query(
        'INSERT INTO move_galeri (program_id, gambar, judul) VALUES (?,?,?)',
        [pid, req.file.filename, judul || '']
      );
      clearMoveCache();
      res.redirect(`/admin/move/${pid}/galeri?success=1`);
    } catch (e) {
      console.error(e);
      res.status(500).send('Terjadi kesalahan');
    }
  });
};

exports.galeriDelete = async (req, res) => {
  try {
    const gid = req.params.gid;
    const [rows] = await db.query('SELECT program_id FROM move_galeri WHERE id=?', [gid]);
    if (!rows.length) return res.redirect('/admin/move');
    await db.query('DELETE FROM move_galeri WHERE id=?', [gid]);
    clearMoveCache();
    res.redirect(`/admin/move/${rows[0].program_id}/galeri?success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

// ── PENGELOLA ─────────────────────────────────────────────────────────────────
exports.pengelolaPage = async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.redirect('/admin/move');
    const [pengelola] = await db.query(
      'SELECT * FROM move_pengelola WHERE program_id = ? ORDER BY urutan ASC, id ASC',
      [program.id]
    );
    res.render('admin/move/pengelola', {
      title: 'Tim Pengelola – ' + program.nama,
      user: req.session,
      program, pengelola,
      csrfToken: req.session.csrfToken,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.pengelolaAdd = (req, res) => {
  const pid = req.params.id;
  uploadPengelola(req, res, async (err) => {
    if (err) return res.redirect(`/admin/move/${pid}/pengelola?error=${encodeURIComponent(err.message)}`);
    await compressImage(req, res, () => {});
    try {
      const { nama, jabatan, urutan } = req.body;
      const foto = req.file ? req.file.filename : null;
      await db.query(
        'INSERT INTO move_pengelola (program_id, nama, jabatan, foto, urutan) VALUES (?,?,?,?,?)',
        [pid, nama, jabatan || '', foto, urutan || 0]
      );
      clearMoveCache();
      res.redirect(`/admin/move/${pid}/pengelola?success=1`);
    } catch (e) {
      console.error(e);
      res.status(500).send('Terjadi kesalahan');
    }
  });
};

exports.pengelolaDelete = async (req, res) => {
  try {
    const pid2 = req.params.pid;
    const [rows] = await db.query('SELECT program_id FROM move_pengelola WHERE id=?', [pid2]);
    if (!rows.length) return res.redirect('/admin/move');
    await db.query('DELETE FROM move_pengelola WHERE id=?', [pid2]);
    clearMoveCache();
    res.redirect(`/admin/move/${rows[0].program_id}/pengelola?success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan');
  }
};
