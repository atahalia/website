const db = require('../config/database');
const { ensureSliderSchema } = require('./sliderController');
const cache = require('../utils/cache');

// ── Helpers dengan cache ──────────────────────────────────────────────────────

const getMenuItems = async () => {
  const cached = cache.get('menu');
  if (cached) return cached;
  try {
    const [rows] = await db.query(
      "SELECT id, label, url, parent_id, urutan FROM menu_navigasi WHERE status = 'aktif' ORDER BY urutan ASC"
    );
    const parents = rows.filter(r => r.parent_id === null);
    parents.forEach(p => {
      p.children = rows.filter(r => r.parent_id === p.id);
      p.children.forEach(c => { c.children = rows.filter(r => r.parent_id === c.id); });
    });
    cache.set('menu', parents, 1800); // cache 30 menit
    return parents;
  } catch (err) {
    console.error('Error loading menu:', err);
    return [];
  }
};
exports.getMenuItems = getMenuItems;

const getMediaSosialFooter = async () => {
  const cached = cache.get('media_sosial_footer');
  if (cached) return cached;
  // Urutkan: terbaru dulu (id DESC), ambil cukup untuk featured (1) + list (5) = 6
  const [rows] = await db.query(
    "SELECT id, judul, platform, embed_url, thumbnail FROM media_sosial WHERE status = 'aktif' ORDER BY id DESC LIMIT 6"
  );
  cache.set('media_sosial_footer', rows, 60); // cache 60 detik
  return rows;
};

exports.getMediaSosialFooter = getMediaSosialFooter;

const getProfilSekolah = async () => {
  const cached = cache.get('profil_sekolah');
  if (cached) return cached;
  const [rows] = await db.query('SELECT * FROM profil_sekolah LIMIT 1');
  const profil = rows[0] || {};
  cache.set('profil_sekolah', profil, 3600); // cache 1 jam
  return profil;
};

exports.getProfilSekolah = getProfilSekolah;

const getRelatedBerita = async (excludeId = null) => {
  const key = `related_berita_${excludeId || 'all'}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const [rows] = excludeId
    ? await db.query('SELECT id, judul, slug, gambar, created_at FROM berita WHERE status = "published" AND id != ? ORDER BY created_at DESC LIMIT 4', [excludeId])
    : await db.query('SELECT id, judul, slug, gambar, created_at FROM berita WHERE status = "published" ORDER BY created_at DESC LIMIT 4');
  cache.set(key, rows, 120); // cache 2 menit
  return rows;
};

const getProfilKonten = async (tipe) => {
  const key = `profil_konten_${tipe}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const [rows] = await db.query('SELECT * FROM profil_konten WHERE tipe = ?', [tipe]);
  const result = rows[0] || { tipe, judul: '', konten: '', foto: null };
  cache.set(key, result, 600);
  return result;
};

async function getAlumniHome() {
  const cached = cache.get('home_alumni');
  if (cached) return cached;
  const [ids] = await db.query("SELECT id FROM alumni WHERE status='disetujui'");
  if (!ids.length) {
    cache.set('home_alumni', [], 300);
    return [];
  }
  const picked = ids.sort(() => Math.random() - 0.5).slice(0, 6).map(r => r.id);
  const [rows] = await db.query(
    `SELECT id,nama,tahun_lulus,jurusan,pekerjaan,perusahaan,foto,cerita FROM alumni WHERE id IN (${picked.map(() => '?').join(',')})`,
    picked
  );
  const order = new Map(picked.map((id, i) => [id, i]));
  rows.sort((a, b) => order.get(a.id) - order.get(b.id));
  cache.set('home_alumni', rows, 300);
  return rows;
}

async function getHomeSlider() {
  const cached = cache.get('home_slider');
  if (cached) return cached;
  const [rows] = await db.query('SELECT * FROM slider WHERE status = "aktif" ORDER BY urutan ASC, created_at DESC');
  cache.set('home_slider', rows, 600); // cache 10 menit
  return rows;
}

const { getSettings } = require('./kontrolWebsiteController');

async function getGuruHome() {
  const cached = cache.get('home_guru');
  if (cached) return cached;
  const [rows] = await db.query(`SELECT id, nama, jabatan, mata_pelajaran, foto,
    CASE
      WHEN LOWER(jabatan) LIKE '%kepala sekolah%' OR LOWER(jabatan) LIKE '%kepsek%' THEN 1
      WHEN LOWER(jabatan) LIKE '%wakil kepala%' OR LOWER(jabatan) LIKE '%waka%' THEN 2
      WHEN LOWER(jabatan) LIKE '%kepala tata usaha%' OR LOWER(jabatan) LIKE '%ktu%' THEN 3
      WHEN LOWER(jabatan) LIKE '%kepala program%' OR LOWER(jabatan) LIKE '%kaproli%' OR LOWER(jabatan) LIKE '%kaprogli%' OR LOWER(jabatan) LIKE '%kepala jurusan%' OR LOWER(jabatan) LIKE '%kakomli%' THEN 4
      WHEN LOWER(jabatan) LIKE '%guru%' THEN 5
      WHEN LOWER(jabatan) LIKE '%staf%' OR LOWER(jabatan) LIKE '%staff%' OR LOWER(jabatan) LIKE '%karyawan%' OR LOWER(jabatan) LIKE '%tata usaha%' THEN 6
      ELSE 7
    END AS urutan_jabatan
    FROM guru ORDER BY urutan_jabatan ASC, nama ASC`);
  cache.set('home_guru', rows, 600); // cache 10 menit
  return rows;
}

async function getGaleriHome() {
  const cached = cache.get('home_galeri');
  if (cached) return cached;
  const [rows] = await db.query('SELECT judul, MIN(gambar) as gambar, COUNT(*) as jumlah FROM galeri GROUP BY judul ORDER BY MAX(created_at) DESC LIMIT 5');
  cache.set('home_galeri', rows, 300); // cache 5 menit
  return rows;
}

// ── Frontend Controllers ──────────────────────────────────────────────────────

exports.home = async (req, res) => {
  try {
    await ensureSliderSchema();
    // Semua query paralel
    const [
      profil,
      [beritaTerbaru],
      galeri,
      slider,
      [jurusan],
      menuItems,
      mediaSosialFooter,
      [linkTerkait],
      alumniHome,
      [fasilitasHome],
      [artikelHome],
      [fileDownloadHome],
      [bkkHome],
      siteSettings,
      [agendaHome],
      guruHome,
      [moveBeritaHome]
    ] = await Promise.all([
      getProfilSekolah(),
      db.query('SELECT id, judul, slug, gambar, konten, kategori, created_at FROM berita WHERE status = "published" ORDER BY created_at DESC LIMIT 6'),
      getGaleriHome(),
      getHomeSlider(),
      db.query("SELECT id, kode, nama, deskripsi, icon, warna, warna_badge, warna_teks_badge FROM jurusan WHERE status = 'aktif' ORDER BY kode ASC"),
      getMenuItems(),
      getMediaSosialFooter(),
      db.query("SELECT * FROM link_terkait WHERE status = 'aktif' ORDER BY urutan ASC, created_at DESC"),
      getAlumniHome(),
      db.query("SELECT f.*, (SELECT gambar FROM fasilitas_foto WHERE fasilitas_id=f.id ORDER BY urutan ASC, id ASC LIMIT 1) as cover FROM fasilitas f WHERE f.status='published' ORDER BY f.nama ASC LIMIT 7"),
      db.query('SELECT id, judul, slug, gambar, ringkasan, konten, kategori, penulis_nama, created_at FROM artikel WHERE status = "published" AND tampil_home = 1 ORDER BY created_at DESC LIMIT 4'),
      db.query('SELECT id, judul, tipe_file, ukuran_file, kategori, jumlah_download, created_at FROM file_download WHERE status = "aktif" AND tampil_home = 1 ORDER BY created_at DESC LIMIT 6'),
      db.query("SELECT id, judul, slug, perusahaan, lokasi, kategori, gambar, deadline, kontak FROM bkk_lowongan WHERE status='aktif' ORDER BY created_at DESC LIMIT 6"),
      getSettings(),
      db.query("SELECT id, judul, slug, gambar, tanggal_mulai, tanggal_selesai, waktu_mulai, waktu_selesai, lokasi FROM agenda WHERE status='aktif' AND tampil_home=1 AND (tanggal_selesai >= DATE_SUB(CURDATE(), INTERVAL 3 DAY) OR (tanggal_selesai IS NULL AND tanggal_mulai >= DATE_SUB(CURDATE(), INTERVAL 3 DAY))) ORDER BY tanggal_mulai DESC LIMIT 3"),
      getGuruHome(),
      db.query(`SELECT mb.id, mb.judul, mb.ringkasan, mb.gambar, mb.created_at, mp.nama as program_nama, mp.slug as program_slug, mp.warna1, mp.gradient
        FROM move_berita mb JOIN move_program mp ON mp.id = mb.program_id
        WHERE mb.status='published' AND mb.tampil_beranda=1
        ORDER BY mb.created_at DESC LIMIT 4`)
    ]);

    res.render('frontend/home', {
      title: 'Beranda', currentPage: 'home',
      profil, berita: beritaTerbaru, galeri, slider, jurusan, menuItems, mediaSosialFooter, linkTerkait, alumniHome, fasilitasHome,
      artikelHome, fileDownloadHome, bkkHome, siteSettings, agendaHome, guruHome, moveBeritaHome
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.profil = async (req, res) => {
  try {
    const [profil, menuItems, mediaSosialFooter, relatedBerita, [beritaSidebar], [artikelSidebar], [agendaSidebar]] = await Promise.all([
      getProfilSekolah(), getMenuItems(), getMediaSosialFooter(), getRelatedBerita(),
      db.query("SELECT id, judul, slug, gambar, created_at FROM berita WHERE status='published' ORDER BY created_at DESC LIMIT 5"),
      db.query("SELECT id, judul, slug, gambar, created_at FROM artikel WHERE status='published' ORDER BY created_at DESC LIMIT 4"),
      db.query("SELECT id, judul, slug, gambar, tanggal_mulai FROM agenda WHERE status='aktif' ORDER BY tanggal_mulai ASC LIMIT 4")
    ]);
    res.render('frontend/profil', {
      title: 'Profil Sekolah', currentPage: 'profil',
      profil, menuItems, mediaSosialFooter, relatedBerita,
      beritaSidebar, artikelSidebar, agendaSidebar, reqUrl: req.path
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.berita = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 9;
    const offset = (page - 1) * limit;

    const [[berita], [totalRows], profil, menuItems, mediaSosialFooter] = await Promise.all([
      db.query('SELECT id, judul, slug, gambar, kategori, created_at FROM berita WHERE status = "published" ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]),
      db.query('SELECT COUNT(*) as count FROM berita WHERE status = "published"'),
      getProfilSekolah(),
      getMenuItems(),
      getMediaSosialFooter()
    ]);

    res.render('frontend/berita', {
      title: 'Berita', currentPage: page,
      berita, totalPages: Math.ceil(totalRows[0].count / limit),
      profil, menuItems, mediaSosialFooter, relatedBerita: berita.slice(0, 4)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.beritaDetail = async (req, res) => {
  try {
    const [[beritaRows], profil, menuItems, mediaSosialFooter] = await Promise.all([
      db.query('SELECT b.*, u.nama_lengkap as penulis FROM berita b LEFT JOIN users u ON b.penulis_id = u.id WHERE b.slug = ? AND b.status = "published"', [req.params.slug]),
      getProfilSekolah(),
      getMenuItems(),
      getMediaSosialFooter()
    ]);

    if (!beritaRows.length) {
      return res.status(404).render('frontend/404', { title: 'Berita Tidak Ditemukan', menuItems });
    }

    const berita = beritaRows[0];
    const [[beritaTerkait], relatedBerita] = await Promise.all([
      db.query('SELECT id, judul, slug, gambar, created_at FROM berita WHERE status = "published" AND id != ? ORDER BY created_at DESC LIMIT 3', [berita.id]),
      getRelatedBerita(berita.id)
    ]);

    res.render('frontend/berita-detail', {
      title: berita.judul, berita, beritaTerkait,
      profil, menuItems, mediaSosialFooter, relatedBerita
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.galeri = async (req, res) => {
  try {
    const cached = cache.get('galeri_page');
    let galeri, albums;
    if (cached) {
      ({ galeri, albums } = cached);
    } else {
      const [rows] = await db.query('SELECT id, judul, gambar, kategori, deskripsi, created_at FROM galeri ORDER BY created_at DESC LIMIT 300');
      galeri = rows;
      const albumMap = {};
      galeri.forEach(item => {
        const key = item.judul + '|' + (item.kategori || '');
        if (!albumMap[key]) albumMap[key] = { judul: item.judul, kategori: item.kategori, deskripsi: item.deskripsi, cover: item.gambar, fotos: [], created_at: item.created_at };
        albumMap[key].fotos.push(item);
      });
      albums = Object.values(albumMap);
      cache.set('galeri_page', { galeri, albums }, 180); // cache 3 menit
    }

    const [profil, menuItems, mediaSosialFooter, relatedBerita] = await Promise.all([
      getProfilSekolah(), getMenuItems(), getMediaSosialFooter(), getRelatedBerita()
    ]);

    res.render('frontend/galeri', {
      title: 'Galeri', currentPage: 'galeri',
      galeri, albums,
      profil, menuItems, mediaSosialFooter, relatedBerita
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.guru = async (req, res) => {
  try {
    const [[guru], profil, menuItems, mediaSosialFooter, relatedBerita] = await Promise.all([
      db.query('SELECT id, nip, nama, jabatan, mata_pelajaran, foto, email, telepon FROM guru ORDER BY nama ASC'),
      getProfilSekolah(), getMenuItems(), getMediaSosialFooter(), getRelatedBerita()
    ]);

    const jabatanOrder = [
      { key: 'kepsek',        label: 'Kepala Sekolah',          keywords: ['kepala sekolah', 'kepsek'] },
      { key: 'waka',          label: 'Wakil Kepala Sekolah',    keywords: ['wakil kepala', 'waka'] },
      { key: 'ktu',           label: 'Kepala Tata Usaha',       keywords: ['kepala tata usaha', 'ktu'] },
      { key: 'kaproli',       label: 'Kepala Program Keahlian', keywords: ['kaproli', 'kaprogli', 'kepala program', 'kepala jurusan'] },
      { key: 'guru_normatif', label: 'Guru Normatif & Adaptif', keywords: [] },
      { key: 'guru_tkj',      label: 'Guru Kejuruan TKJ',       keywords: [] },
      { key: 'guru_tkr',      label: 'Guru Kejuruan TKR',       keywords: [] },
      { key: 'guru_kuliner',  label: 'Guru Kejuruan Kuliner',   keywords: [] },
      { key: 'guru_tptup',    label: 'Guru Kejuruan TPTUP',     keywords: [] },
      { key: 'staff',         label: 'Staff / Karyawan',        keywords: ['staff', 'staf', 'karyawan', 'tata usaha', 'administrasi', 'operator', 'penjaga', 'satpam', 'cleaning', 'toolman', 'caraka', 'bendahara', 'perpus', 'pustakawan', 'security', 'kebersihan'] },
      { key: 'guru',          label: 'Guru',                    keywords: ['guru'] },
    ];

    const grouped = {};
    jabatanOrder.forEach(j => { grouped[j.key] = []; });
    grouped['lainnya'] = [];

    guru.forEach(g => {
      const jab = (g.jabatan || '').toLowerCase();
      const mapel = (g.mata_pelajaran || '').toLowerCase();
      if (['kepala sekolah', 'kepsek'].some(k => jab.includes(k))) { grouped['kepsek'].push(g); return; }
      if (['wakil kepala', 'waka'].some(k => jab.includes(k))) { grouped['waka'].push(g); return; }
      if (['kepala tata usaha', 'ktu'].some(k => jab.includes(k))) { grouped['ktu'].push(g); return; }
      if (['kaproli', 'kaprogli', 'kepala program', 'kepala jurusan'].some(k => jab.includes(k))) { grouped['kaproli'].push(g); return; }
      if (['staff', 'staf', 'karyawan', 'tata usaha', 'administrasi', 'operator', 'penjaga', 'satpam', 'cleaning', 'toolman', 'caraka', 'bendahara', 'perpus', 'pustakawan', 'security', 'kebersihan'].some(k => jab.includes(k) || mapel.includes(k))) { grouped['staff'].push(g); return; }
      if (mapel.includes('tkj')) { grouped['guru_tkj'].push(g); return; }
      if (mapel.includes('tkr')) { grouped['guru_tkr'].push(g); return; }
      if (mapel.includes('kuliner')) { grouped['guru_kuliner'].push(g); return; }
      if (mapel.includes('tptup')) { grouped['guru_tptup'].push(g); return; }
      if (jab.includes('guru')) { grouped['guru_normatif'].push(g); return; }
      grouped['lainnya'].push(g);
    });
    grouped['guru_normatif'] = [...grouped['guru_normatif'], ...grouped['lainnya']];

    res.render('frontend/guru', {
      title: 'Guru & Staff', currentPage: 'guru',
      guru, grouped, jabatanOrder,
      profil, menuItems, mediaSosialFooter, relatedBerita
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.guruDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const [[guruRows], profil, menuItems, mediaSosialFooter] = await Promise.all([
      db.query('SELECT id, nip, nama, jabatan, mata_pelajaran, foto, email, telepon, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat FROM guru WHERE id = ?', [id]),
      getProfilSekolah(), getMenuItems(), getMediaSosialFooter()
    ]);
    if (!guruRows.length) return res.status(404).render('frontend/404', { title: '404', menuItems: await getMenuItems(), profil: await getProfilSekolah(), mediaSosialFooter: [] });
    const g = guruRows[0];
    res.render('frontend/guru-detail', {
      title: g.nama, currentPage: 'guru',
      guru: g, profil, menuItems, mediaSosialFooter
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.kontakPage = async (req, res) => {
  try {
    const [profil, menuItems, mediaSosialFooter, relatedBerita] = await Promise.all([
      getProfilSekolah(), getMenuItems(), getMediaSosialFooter(), getRelatedBerita()
    ]);
    res.render('frontend/kontak', {
      title: 'Kontak', currentPage: 'kontak',
      profil, success: req.query.success, menuItems, mediaSosialFooter, relatedBerita
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.kontakSubmit = async (req, res) => {
  try {
    const { nama, email, subjek, pesan } = req.body;
    if (!nama || !email || !pesan) return res.redirect('/kontak?error=1');
    await db.query('INSERT INTO kontak_masuk (nama, email, subjek, pesan) VALUES (?, ?, ?, ?)', [nama, email, subjek, pesan]);
    res.redirect('/kontak?success=1');
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.mediaSosial = async (req, res) => {
  try {
    const [[mediaSosial], profil, menuItems, mediaSosialFooter, relatedBerita] = await Promise.all([
      db.query('SELECT * FROM media_sosial WHERE status = "aktif" ORDER BY urutan ASC, created_at DESC'),
      getProfilSekolah(), getMenuItems(), getMediaSosialFooter(), getRelatedBerita()
    ]);
    res.render('frontend/media-sosial', {
      title: 'Media Sosial', currentPage: 'media-sosial',
      mediaSosial, profil, menuItems, mediaSosialFooter, relatedBerita
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.visiMisi = async (req, res) => {
  try {
    const [profil, konten, menuItems, mediaSosialFooter, relatedBerita, [beritaSidebar], [artikelSidebar], [agendaSidebar]] = await Promise.all([
      getProfilSekolah(), getProfilKonten('visi_misi'), getMenuItems(), getMediaSosialFooter(), getRelatedBerita(),
      db.query("SELECT id, judul, slug, gambar, created_at FROM berita WHERE status='published' ORDER BY created_at DESC LIMIT 5"),
      db.query("SELECT id, judul, slug, gambar, created_at FROM artikel WHERE status='published' ORDER BY created_at DESC LIMIT 4"),
      db.query("SELECT id, judul, slug, gambar, tanggal_mulai FROM agenda WHERE status='aktif' ORDER BY tanggal_mulai ASC LIMIT 4")
    ]);
    res.render('frontend/profil-konten', { title: 'Visi & Misi', currentPage: 'profil', profil, konten, activeMenu: 'visi-misi', menuItems, mediaSosialFooter, relatedBerita, beritaSidebar, artikelSidebar, agendaSidebar, reqUrl: req.path });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.sejarah = async (req, res) => {
  try {
    const [profil, konten, menuItems, mediaSosialFooter, relatedBerita, [beritaSidebar], [artikelSidebar], [agendaSidebar]] = await Promise.all([
      getProfilSekolah(), getProfilKonten('sejarah'), getMenuItems(), getMediaSosialFooter(), getRelatedBerita(),
      db.query("SELECT id, judul, slug, gambar, created_at FROM berita WHERE status='published' ORDER BY created_at DESC LIMIT 5"),
      db.query("SELECT id, judul, slug, gambar, created_at FROM artikel WHERE status='published' ORDER BY created_at DESC LIMIT 4"),
      db.query("SELECT id, judul, slug, gambar, tanggal_mulai FROM agenda WHERE status='aktif' ORDER BY tanggal_mulai ASC LIMIT 4")
    ]);
    res.render('frontend/profil-konten', { title: 'Sejarah Sekolah', currentPage: 'profil', profil, konten, activeMenu: 'sejarah', menuItems, mediaSosialFooter, relatedBerita, beritaSidebar, artikelSidebar, agendaSidebar, reqUrl: req.path });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.sambutan = async (req, res) => {
  try {
    const [profil, [kepsekRows], menuItems, mediaSosialFooter, relatedBerita, [beritaSidebar], [artikelSidebar], [agendaSidebar]] = await Promise.all([
      getProfilSekolah(),
      db.query("SELECT * FROM profil_konten WHERE tipe = 'sambutan' LIMIT 1"),
      getMenuItems(), getMediaSosialFooter(), getRelatedBerita(),
      db.query("SELECT id, judul, slug, gambar, created_at FROM berita WHERE status='published' ORDER BY created_at DESC LIMIT 5"),
      db.query("SELECT id, judul, slug, gambar, created_at FROM artikel WHERE status='published' ORDER BY created_at DESC LIMIT 4"),
      db.query("SELECT id, judul, slug, gambar, tanggal_mulai FROM agenda WHERE status='aktif' ORDER BY tanggal_mulai ASC LIMIT 4")
    ]);
    res.render('frontend/sambutan-kepsek', {
      title: 'Sambutan Kepala Sekolah', currentPage: 'profil',
      profil, kepsek: kepsekRows[0] || null, menuItems, mediaSosialFooter, relatedBerita,
      beritaSidebar, artikelSidebar, agendaSidebar, reqUrl: req.path
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};

exports.sambutanKepsek = async (req, res) => {
  try {
    const [profil, [kepsekRows], menuItems, mediaSosialFooter, relatedBerita, [beritaSidebar], [artikelSidebar], [agendaSidebar]] = await Promise.all([
      getProfilSekolah(),
      db.query("SELECT * FROM profil_konten WHERE tipe = 'sambutan' LIMIT 1"),
      getMenuItems(), getMediaSosialFooter(), getRelatedBerita(),
      db.query("SELECT id, judul, slug, gambar, created_at FROM berita WHERE status='published' ORDER BY created_at DESC LIMIT 5"),
      db.query("SELECT id, judul, slug, gambar, created_at FROM artikel WHERE status='published' ORDER BY created_at DESC LIMIT 4"),
      db.query("SELECT id, judul, slug, gambar, tanggal_mulai FROM agenda WHERE status='aktif' ORDER BY tanggal_mulai ASC LIMIT 4")
    ]);
    res.render('frontend/sambutan-kepsek', {
      title: 'Sambutan Kepala Sekolah', currentPage: 'profil',
      profil, kepsek: kepsekRows[0] || null, menuItems, mediaSosialFooter, relatedBerita,
      beritaSidebar, artikelSidebar, agendaSidebar, reqUrl: req.path
    });
  } catch (err) { console.error(err); res.status(500).send('Terjadi kesalahan'); }
};


// ── MOVE – Melayani Komunitas Via Edukasi (baca dari DB) ─────────────────────

/**
 * Helper: ambil semua program MOVE aktif dengan data lengkap dari DB.
 * Hasilnya di-cache 120 detik agar tidak query DB setiap halaman dibuka.
 */
async function getMovePrograms() {
  const cached = cache.get('move_all_programs');
  if (cached) return cached;

  const [programs] = await db.query(
    "SELECT * FROM move_program WHERE status='aktif' ORDER BY urutan ASC, id ASC"
  );

  // Untuk setiap program, ambil layanan, sosmed, galeri, pengelola, proyek, berita secara paralel
  await Promise.all(programs.map(async (p) => {
    const [
      [layanan],
      [sosmedRows],
      [galeri],
      [pengelola],
      [proyek],
      [berita]
    ] = await Promise.all([
      db.query('SELECT * FROM move_layanan WHERE program_id=? ORDER BY urutan ASC, id ASC', [p.id]),
      db.query('SELECT * FROM move_sosmed WHERE program_id=?', [p.id]),
      db.query('SELECT * FROM move_galeri WHERE program_id=? ORDER BY created_at DESC', [p.id]),
      db.query('SELECT * FROM move_pengelola WHERE program_id=? ORDER BY urutan ASC, id ASC', [p.id]),
      db.query("SELECT * FROM move_proyek WHERE program_id=? AND status='published' ORDER BY tahun DESC, id DESC", [p.id]),
      db.query("SELECT id,judul,ringkasan,gambar,created_at FROM move_berita WHERE program_id=? AND status='published' ORDER BY created_at DESC LIMIT 4", [p.id])
    ]);
    p.layanan   = layanan;
    p.sosmed    = sosmedRows[0] || { instagram:'', tiktok:'', youtube:'', facebook:'', whatsapp:'', embed:'' };
    p.galeri    = galeri;
    p.pengelola = pengelola;
    p.berita    = berita;

    // Ambil fotos per proyek — graceful fallback jika tabel belum ada
    const proyekIds = proyek.map(pr => pr.id);
    if (proyekIds.length > 0) {
      try {
        const [allFotos] = await db.query(
          `SELECT * FROM move_proyek_foto WHERE proyek_id IN (${proyekIds.map(() => '?').join(',')}) ORDER BY urutan ASC, id ASC`,
          proyekIds
        );
        const fotosMap = {};
        allFotos.forEach(f => {
          if (!fotosMap[f.proyek_id]) fotosMap[f.proyek_id] = [];
          fotosMap[f.proyek_id].push(f);
        });
        proyek.forEach(pr => { pr.fotos = fotosMap[pr.id] || []; });
      } catch (e) {
        console.warn('move_proyek_foto belum ada:', e.message);
        proyek.forEach(pr => { pr.fotos = []; });
      }
      // Ambil anggota tim per proyek
      try {
        const [allAnggota] = await db.query(
          `SELECT * FROM move_proyek_anggota WHERE proyek_id IN (${proyekIds.map(() => '?').join(',')}) ORDER BY urutan ASC, id ASC`,
          proyekIds
        );
        const anggotaMap = {};
        allAnggota.forEach(a => {
          if (!anggotaMap[a.proyek_id]) anggotaMap[a.proyek_id] = [];
          anggotaMap[a.proyek_id].push(a);
        });
        proyek.forEach(pr => { pr.anggota = anggotaMap[pr.id] || []; });
      } catch (e) {
        console.warn('move_proyek_anggota belum ada:', e.message);
        proyek.forEach(pr => { pr.anggota = []; });
      }
    } else {
      proyek.forEach(pr => { pr.fotos = []; pr.anggota = []; });
    }
    p.proyek    = proyek;
    // Alias warna_light → warnaLight agar kompatibel dengan template EJS
    p.warnaLight = p.warna_light || '#eff6ff';
    p.deskripsi_singkat = p.deskripsi_singkat || '';
  }));

  cache.set('move_all_programs', programs, 30); // cache 30 detik
  return programs;
}

/** GET /move — halaman index semua jurusan */
exports.moveIndex = async (req, res) => {
  try {
    const allJurusan = await getMovePrograms();

    // Ambil semua proyek gabungan semua jurusan
    const [[allProyek], [rows]] = await Promise.all([
      db.query(`
        SELECT mp.id, mp.judul, mp.deskripsi, mp.tahun, mp.tanggal_pelaksanaan,
               mp.lokasi, mp.gambar, mp.jumlah_siswa, mp.jumlah_item, mp.satuan_item,
               mp.nama_pelanggan, mp.kategori_pelanggan, mp.link_maps, mp.link_publikasi,
               mp.link_tiktok, mp.link_youtube, mp.link_facebook, mp.link_twitter, mp.link_threads,
               pr.nama as program_nama, pr.slug as program_slug,
               pr.warna1 as program_warna1, pr.gradient as program_gradient
        FROM move_proyek mp
        JOIN move_program pr ON pr.id = mp.program_id
        WHERE mp.status = 'published' AND pr.status = 'aktif'
        ORDER BY mp.tahun DESC, mp.id DESC
      `),
      db.query(
        `SELECT setting_key, setting_value FROM website_settings WHERE setting_key LIKE 'move_%'`
      )
    ]);

    // Ambil berita gabungan semua jurusan
    let allBerita = [];
    try {
      const [beritaRows] = await db.query(`
        SELECT mb.id, mb.judul, mb.ringkasan, mb.gambar, mb.created_at,
               mp.nama as program_nama, mp.slug as program_slug, mp.warna1, mp.gradient
        FROM move_berita mb
        JOIN move_program mp ON mp.id = mb.program_id
        WHERE mb.status = 'published' AND mp.status = 'aktif'
        ORDER BY mb.created_at DESC LIMIT 4
      `);
      allBerita = beritaRows;
    } catch(e) { console.warn('move_berita error:', e.message); }

    // Ambil galeri gabungan semua jurusan
    let allGaleri = [];
    try {
      const [galeriRows] = await db.query(`
        SELECT mg.id, mg.gambar, mg.judul,
               mp.nama as program_nama, mp.slug as program_slug, mp.warna1
        FROM move_galeri mg
        JOIN move_program mp ON mp.id = mg.program_id
        WHERE mp.status = 'aktif'
        ORDER BY mg.created_at DESC LIMIT 12
      `);
      allGaleri = galeriRows;
    } catch(e) { console.warn('move_galeri error:', e.message); }

    // Ambil fotos untuk semua proyek gabungan — graceful fallback
    if (allProyek.length > 0) {
      try {
        const ids = allProyek.map(p => p.id);
        const [allFotos] = await db.query(
          `SELECT * FROM move_proyek_foto WHERE proyek_id IN (${ids.map(()=>'?').join(',')}) ORDER BY urutan ASC, id ASC`,
          ids
        );
        const fotosMap = {};
        allFotos.forEach(f => {
          if (!fotosMap[f.proyek_id]) fotosMap[f.proyek_id] = [];
          fotosMap[f.proyek_id].push(f);
        });
        allProyek.forEach(p => { p.fotos = fotosMap[p.id] || []; });
      } catch (e) {
        console.warn('move_proyek_foto belum ada:', e.message);
        allProyek.forEach(p => { p.fotos = []; });
      }
      // Ambil anggota per proyek
      try {
        const ids = allProyek.map(p => p.id);
        const [allAnggota] = await db.query(
          `SELECT * FROM move_proyek_anggota WHERE proyek_id IN (${ids.map(()=>'?').join(',')}) ORDER BY urutan ASC, id ASC`,
          ids
        );
        const anggotaMap = {};
        allAnggota.forEach(a => {
          if (!anggotaMap[a.proyek_id]) anggotaMap[a.proyek_id] = [];
          anggotaMap[a.proyek_id].push(a);
        });
        allProyek.forEach(p => { p.anggota = anggotaMap[p.id] || []; });
      } catch (e) {
        console.warn('move_proyek_anggota belum ada:', e.message);
        allProyek.forEach(p => { p.anggota = []; });
      }
    }

    // Susun settings ke object
    const tentang = {};
    rows.forEach(r => { tentang[r.setting_key] = r.setting_value; });

    // Parse misi jadi array
    const misiRaw = tentang.move_misi || 'Memberikan layanan berkualitas gratis kepada masyarakat\nMengembangkan kompetensi siswa melalui praktik lapangan\nMembangun kepercayaan komunitas terhadap pendidikan vokasi\nMendokumentasikan setiap kegiatan sebagai portofolio nyata';
    tentang.move_misi_arr = misiRaw.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6);

    // Langkah cara kerja default jika belum diisi
    const defaultSteps = [
      { judul: 'Komunitas Mengajukan', desc: 'Komunitas, lembaga, atau warga mengajukan kebutuhan layanan melalui WhatsApp atau formulir online.' },
      { judul: 'Tim Dibentuk',         desc: 'Guru pembimbing membentuk tim siswa dari jurusan yang sesuai dengan kebutuhan layanan yang diminta.' },
      { judul: 'Kami Datang ke Lokasi',desc: 'Tim berangkat ke lokasi komunitas — tidak perlu komunitas datang ke sekolah. Kami yang hadir.' },
      { judul: 'Layanan Diberikan',    desc: 'Layanan dikerjakan secara profesional, terdokumentasi, dan dilaporkan sebagai bagian dari portofolio siswa.' }
    ];
    tentang.steps = defaultSteps.map((d, i) => ({
      judul: tentang[`move_step${i+1}_judul`] || d.judul,
      desc:  tentang[`move_step${i+1}_desc`]  || d.desc
    }));

    // Statistik agregat untuk banner di atas peta
    let moveStats = {
      total_proyek: 0, total_pelanggan: 0, total_siswa: 0,
      total_jurusan: allJurusan.length, tahun_mulai: 2025,
      total_lokasi: 0
    };
    try {
      const [[statsRow]] = await db.query(`
        SELECT
          COUNT(DISTINCT mp.id)                          AS total_proyek,
          COALESCE(SUM(mp.jumlah_siswa), 0)              AS total_siswa,
          MIN(mp.tahun)                                  AS tahun_mulai
        FROM move_proyek mp
        JOIN move_program pr ON pr.id = mp.program_id
        WHERE mp.status='published' AND pr.status='aktif'
      `);
      const [[pelRow]] = await db.query(`SELECT COUNT(*) AS cnt FROM move_pelanggan`);
      moveStats.total_proyek    = statsRow.total_proyek || 0;
      moveStats.total_siswa     = statsRow.total_siswa  || 0;
      moveStats.tahun_mulai     = 2025; // Program MOVE dimulai tahun 2025
      moveStats.total_pelanggan = pelRow.cnt || 0;
      moveStats.total_lokasi    = pelRow.cnt || 0;
    } catch(e) { /* tabel mungkin belum ada kolom baru */ }

    res.render('frontend/move-index', {
      title: 'MOVE – Melayani Komunitas Via Edukasi',
      allJurusan,
      allProyek,
      allBerita,
      allGaleri,
      tentang,
      moveStats
    });
  } catch (err) {
    console.error('MOVE index error:', err);
    res.status(500).send('Terjadi kesalahan');
  }
};

/** GET /move/:slug — landing page per jurusan */
exports.moveJurusan = async (req, res) => {
  try {
    const slug       = req.params.slug;
    const allJurusan = await getMovePrograms();
    const jurusan    = allJurusan.find(j => j.slug === slug);
    if (!jurusan) return res.redirect('/move');

    res.render('frontend/move', {
      title: `MOVE – ${jurusan.nama} | SMKN 1 Kras`,
      jurusan,
      allJurusan
    });
  } catch (err) {
    console.error('MOVE jurusan error:', err);
    res.status(500).send('Terjadi kesalahan');
  }
};

/** GET /move/peta — halaman peta gabungan semua program */
exports.movePeta = async (req, res) => {
  try {
    const allJurusan = await getMovePrograms();
    res.render('frontend/move-peta', {
      title: 'Peta Sebaran Layanan MOVE | SMKN 1 Kras',
      allJurusan
    });
  } catch (err) {
    console.error('MOVE peta error:', err);
    res.status(500).send('Terjadi kesalahan');
  }
};
