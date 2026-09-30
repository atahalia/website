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

// ── Frontend Controllers ──────────────────────────────────────────────────────

exports.home = async (req, res) => {
  try {
    await ensureSliderSchema();
    // Semua query paralel
    const [
      profil,
      [beritaTerbaru],
      [galeri],
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
      [guruHome]
    ] = await Promise.all([
      getProfilSekolah(),
      db.query('SELECT id, judul, slug, gambar, konten, kategori, created_at FROM berita WHERE status = "published" ORDER BY created_at DESC LIMIT 6'),
      db.query('SELECT judul, MIN(gambar) as gambar, COUNT(*) as jumlah FROM galeri GROUP BY judul ORDER BY MAX(created_at) DESC LIMIT 5'),
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
      db.query(`SELECT id, nama, jabatan, mata_pelajaran, foto,
        CASE
          WHEN LOWER(jabatan) LIKE '%kepala sekolah%' OR LOWER(jabatan) LIKE '%kepsek%' THEN 1
          WHEN LOWER(jabatan) LIKE '%wakil kepala%' OR LOWER(jabatan) LIKE '%waka%' THEN 2
          WHEN LOWER(jabatan) LIKE '%kepala tata usaha%' OR LOWER(jabatan) LIKE '%ktu%' THEN 3
          WHEN LOWER(jabatan) LIKE '%kepala program%' OR LOWER(jabatan) LIKE '%kaproli%' OR LOWER(jabatan) LIKE '%kaprogli%' OR LOWER(jabatan) LIKE '%kepala jurusan%' OR LOWER(jabatan) LIKE '%kakomli%' THEN 4
          WHEN LOWER(jabatan) LIKE '%guru%' THEN 5
          WHEN LOWER(jabatan) LIKE '%staf%' OR LOWER(jabatan) LIKE '%staff%' OR LOWER(jabatan) LIKE '%karyawan%' OR LOWER(jabatan) LIKE '%tata usaha%' THEN 6
          ELSE 7
        END AS urutan_jabatan
        FROM guru
        ORDER BY urutan_jabatan ASC, nama ASC`)
    ]);

    res.render('frontend/home', {
      title: 'Beranda', currentPage: 'home',
      profil, berita: beritaTerbaru, galeri, slider, jurusan, menuItems, mediaSosialFooter, linkTerkait, alumniHome, fasilitasHome,
      artikelHome, fileDownloadHome, bkkHome, siteSettings, agendaHome, guruHome
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
    const [[galeri], profil, menuItems, mediaSosialFooter, relatedBerita] = await Promise.all([
      db.query('SELECT * FROM galeri ORDER BY created_at DESC'),
      getProfilSekolah(), getMenuItems(), getMediaSosialFooter(), getRelatedBerita()
    ]);

    const albumMap = {};
    galeri.forEach(item => {
      const key = item.judul + '|' + (item.kategori || '');
      if (!albumMap[key]) albumMap[key] = { judul: item.judul, kategori: item.kategori, deskripsi: item.deskripsi, cover: item.gambar, fotos: [], created_at: item.created_at };
      albumMap[key].fotos.push(item);
    });

    res.render('frontend/galeri', {
      title: 'Galeri', currentPage: 'galeri',
      galeri, albums: Object.values(albumMap),
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


// ── MOVE – Melayani Komunitas Via Edukasi ────────────────────────────────────

/**
 * Data konfigurasi per jurusan untuk program MOVE.
 * Pengelola masing-masing jurusan cukup edit bagian datanya di sini.
 * Field yang bisa diisi:
 *   nama, slug, icon, gradient, warna1, warna2, warnaLight
 *   hero_title, hero_sub, hero_card_title, hero_card_desc
 *   stat_penerima, stat_layanan, stat_relawan
 *   kontak_wa, deskripsi_singkat
 *   layanan[]  { icon, nama, deskripsi }
 *   sosmed     { instagram, tiktok, youtube, facebook, whatsapp, embed }
 *   pengelola[]{ nama, jabatan, foto }
 *   galeri[]   { gambar, judul }  ← bisa dikosongkan
 */
const MOVE_JURUSAN = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. TEKNIK KOMPUTER JARINGAN (TKJ)
  // ──────────────────────────────────────────────────────────────────────────
  {
    nama: 'Teknik Komputer Jaringan',
    slug: 'tkj',
    icon: 'fas fa-network-wired',
    gradient: 'linear-gradient(135deg,#1e3a5f 0%,#1a56db 100%)',
    warna1: '#1e3a5f',
    warna2: '#f59e0b',
    warnaLight: '#eff6ff',
    hero_title: 'Solusi Digital<br>untuk Komunitas Anda',
    hero_sub: 'Tim TKJ SMKN 1 Kras siap membantu instalasi jaringan, pelatihan komputer, dan konsultasi IT gratis untuk komunitas, UMKM, dan lembaga pendidikan.',
    hero_card_title: 'Layanan IT Gratis Siap Hadir',
    hero_card_desc: 'Dari setting WiFi hingga pelatihan komputer – kami datang ke lokasi Anda.',
    stat_penerima: '200+',
    stat_layanan: '8',
    stat_relawan: '30',
    kontak_wa: '6281234567890',
    deskripsi_singkat: 'Layanan IT, jaringan komputer, dan pelatihan digital gratis untuk komunitas sekitar.',
    layanan: [
      { icon: 'fas fa-wifi',            nama: 'Instalasi Jaringan WiFi',     deskripsi: 'Setting dan instalasi jaringan WiFi untuk masjid, mushola, RT/RW, dan UMKM secara gratis.' },
      { icon: 'fas fa-laptop',          nama: 'Pelatihan Komputer Dasar',    deskripsi: 'Belajar mengoperasikan komputer, Ms. Office, dan internet untuk masyarakat umum.' },
      { icon: 'fas fa-shield-alt',      nama: 'Keamanan Perangkat',         deskripsi: 'Pembersihan virus, instal ulang OS, dan penguatan keamanan perangkat secara gratis.' },
      { icon: 'fas fa-print',           nama: 'Servis Printer & Komputer',   deskripsi: 'Perbaikan ringan printer dan komputer untuk warga yang membutuhkan.' },
      { icon: 'fas fa-globe',           nama: 'Pembuatan Akun Digital UMKM', deskripsi: 'Bantu UMKM punya akun Google Bisnis, media sosial, dan kehadiran digital dasar.' },
      { icon: 'fas fa-chalkboard-teacher', nama: 'Literasi Digital Lansia',  deskripsi: 'Pelatihan khusus untuk warga lansia agar bisa menggunakan smartphone dengan aman.' }
    ],
    sosmed: {
      instagram: 'https://instagram.com/tkj_smkn1kras',
      tiktok:    '',
      youtube:   '',
      facebook:  '',
      whatsapp:  '6281234567890',
      embed:     ''
    },
    pengelola: [
      { nama: 'Nama Koordinator TKJ', jabatan: 'Koordinator Program',   foto: '' },
      { nama: 'Nama Guru Pembimbing', jabatan: 'Guru Pembimbing',        foto: '' }
    ],
    galeri: []
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. TEKNIK KENDARAAN RINGAN (TKR)
  // ──────────────────────────────────────────────────────────────────────────
  {
    nama: 'Teknik Kendaraan Ringan',
    slug: 'tkr',
    icon: 'fas fa-car',
    gradient: 'linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)',
    warna1: '#7f1d1d',
    warna2: '#fbbf24',
    warnaLight: '#fff1f2',
    hero_title: 'Servis Kendaraan<br>Gratis untuk Komunitas',
    hero_sub: 'Tim TKR SMKN 1 Kras menghadirkan layanan perawatan kendaraan ringan, tune up, dan konsultasi otomotif gratis untuk masyarakat sekitar.',
    hero_card_title: 'Bengkel Keliling Gratis',
    hero_card_desc: 'Tune up, cek berkala, dan ganti oli ringan – hadir langsung ke komunitas Anda.',
    stat_penerima: '150+',
    stat_layanan: '6',
    stat_relawan: '25',
    kontak_wa: '6281234567891',
    deskripsi_singkat: 'Servis ringan, tune up, dan pelatihan otomotif gratis untuk komunitas sekitar.',
    layanan: [
      { icon: 'fas fa-oil-can',         nama: 'Ganti Oli & Filter',          deskripsi: 'Layanan ganti oli dan filter kendaraan ringan secara gratis untuk warga sekitar sekolah.' },
      { icon: 'fas fa-car-battery',     nama: 'Cek Aki & Kelistrikan',       deskripsi: 'Pemeriksaan kondisi aki dan sistem kelistrikan kendaraan secara gratis.' },
      { icon: 'fas fa-tachometer-alt',  nama: 'Tune Up Ringan',              deskripsi: 'Servis tune up ringan meliputi busi, filter udara, dan karburator untuk kendaraan komunitas.' },
      { icon: 'fas fa-tire',            nama: 'Cek & Pompa Ban',             deskripsi: 'Pemeriksaan tekanan ban dan tambal ban ringan secara gratis di lingkungan komunitas.' },
      { icon: 'fas fa-chalkboard-teacher', nama: 'Pelatihan Perawatan Motor', deskripsi: 'Edukasi cara merawat sepeda motor sendiri agar tetap prima dan irit bahan bakar.' },
      { icon: 'fas fa-tools',           nama: 'Konsultasi Otomotif',         deskripsi: 'Tanya jawab gratis seputar masalah kendaraan ringan dengan siswa dan guru TKR.' }
    ],
    sosmed: {
      instagram: 'https://instagram.com/tkr_smkn1kras',
      tiktok:    '',
      youtube:   '',
      facebook:  '',
      whatsapp:  '6281234567891',
      embed:     ''
    },
    pengelola: [
      { nama: 'Nama Koordinator TKR', jabatan: 'Koordinator Program',   foto: '' },
      { nama: 'Nama Guru Pembimbing', jabatan: 'Guru Pembimbing',        foto: '' }
    ],
    galeri: []
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. TATA BUSANA
  // ──────────────────────────────────────────────────────────────────────────
  {
    nama: 'Tata Busana',
    slug: 'busana',
    icon: 'fas fa-cut',
    gradient: 'linear-gradient(135deg,#4a1d96 0%,#7c3aed 100%)',
    warna1: '#4a1d96',
    warna2: '#f59e0b',
    warnaLight: '#f5f3ff',
    hero_title: 'Mode & Kreatif<br>untuk Komunitas',
    hero_sub: 'Tim Tata Busana SMKN 1 Kras hadir dengan layanan menjahit, sulam, dan pelatihan fashion gratis untuk ibu-ibu PKK, komunitas, dan UMKM kreatif.',
    hero_card_title: 'Pelatihan Menjahit Gratis',
    hero_card_desc: 'Dari pola dasar hingga busana jadi – kami ajarkan langsung di komunitas Anda.',
    stat_penerima: '100+',
    stat_layanan: '7',
    stat_relawan: '20',
    kontak_wa: '6281234567892',
    deskripsi_singkat: 'Pelatihan menjahit, sulam, dan fashion gratis untuk ibu-ibu PKK dan komunitas kreatif.',
    layanan: [
      { icon: 'fas fa-cut',             nama: 'Pelatihan Menjahit Dasar',    deskripsi: 'Belajar pola dasar, cara menjahit, dan membuat busana sederhana untuk pemula.' },
      { icon: 'fas fa-tshirt',          nama: 'Modifikasi & Repair Pakaian', deskripsi: 'Perbaikan pakaian rusak dan modifikasi busana lama menjadi tampilan baru.' },
      { icon: 'fas fa-feather-alt',     nama: 'Pelatihan Sulam & Bordir',    deskripsi: 'Teknik sulam tangan dan bordir untuk kreasi kerajinan dan busana daerah.' },
      { icon: 'fas fa-shopping-bag',    nama: 'Pembuatan Tas & Aksesoris',   deskripsi: 'Workshop membuat tas kain, dompet, dan aksesoris fashion dari bahan daur ulang.' },
      { icon: 'fas fa-store',           nama: 'Konsultasi UMKM Busana',      deskripsi: 'Bimbingan pengembangan usaha fashion rumahan, dari produksi hingga pemasaran.' },
      { icon: 'fas fa-palette',         nama: 'Desain Batik & Kain Jumputan', deskripsi: 'Pelatihan membuat batik tulis sederhana dan teknik jumputan untuk komunitas.' }
    ],
    sosmed: {
      instagram: 'https://instagram.com/busana_smkn1kras',
      tiktok:    '',
      youtube:   '',
      facebook:  '',
      whatsapp:  '6281234567892',
      embed:     ''
    },
    pengelola: [
      { nama: 'Nama Koordinator Busana', jabatan: 'Koordinator Program',  foto: '' },
      { nama: 'Nama Guru Pembimbing',    jabatan: 'Guru Pembimbing',       foto: '' }
    ],
    galeri: []
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. TATA BOGA (KULINER)
  // ──────────────────────────────────────────────────────────────────────────
  {
    nama: 'Tata Boga',
    slug: 'boga',
    icon: 'fas fa-utensils',
    gradient: 'linear-gradient(135deg,#064e3b 0%,#059669 100%)',
    warna1: '#064e3b',
    warna2: '#fbbf24',
    warnaLight: '#ecfdf5',
    hero_title: 'Kuliner Lezat<br>untuk Komunitas',
    hero_sub: 'Tim Tata Boga SMKN 1 Kras berbagi resep, pelatihan memasak, dan pengembangan usaha kuliner UMKM secara gratis untuk masyarakat sekitar.',
    hero_card_title: 'Workshop Masak Gratis',
    hero_card_desc: 'Masakan Indonesia, pastry, dan manajemen warung – hadir di komunitas Anda.',
    stat_penerima: '180+',
    stat_layanan: '8',
    stat_relawan: '28',
    kontak_wa: '6281234567893',
    deskripsi_singkat: 'Pelatihan memasak, pastry, dan pengembangan UMKM kuliner gratis untuk masyarakat.',
    layanan: [
      { icon: 'fas fa-utensils',        nama: 'Pelatihan Memasak Dasar',     deskripsi: 'Workshop memasak masakan Indonesia sehari-hari yang praktis, lezat, dan hemat biaya.' },
      { icon: 'fas fa-birthday-cake',   nama: 'Workshop Pastry & Kue',       deskripsi: 'Belajar membuat kue kering, brownies, dan aneka pastry untuk konsumsi atau usaha.' },
      { icon: 'fas fa-store',           nama: 'Konsultasi UMKM Kuliner',     deskripsi: 'Pendampingan pengembangan usaha kuliner: menu, harga, packaging, dan pemasaran.' },
      { icon: 'fas fa-leaf',            nama: 'Pelatihan Olahan Sayur & Herbal', deskripsi: 'Cara mengolah sayuran lokal dan tanaman herbal menjadi produk bernilai jual.' },
      { icon: 'fas fa-bread-slice',     nama: 'Pelatihan Roti & Bakery',     deskripsi: 'Teknik dasar pembuatan roti tawar, roti manis, dan produk bakery rumahan.' },
      { icon: 'fas fa-mug-hot',         nama: 'Barista & Minuman Kekinian',  deskripsi: 'Pelatihan membuat kopi, minuman kekinian, dan teknik presentasi untuk UMKM.' }
    ],
    sosmed: {
      instagram: 'https://instagram.com/boga_smkn1kras',
      tiktok:    '',
      youtube:   '',
      facebook:  '',
      whatsapp:  '6281234567893',
      embed:     ''
    },
    pengelola: [
      { nama: 'Nama Koordinator Boga', jabatan: 'Koordinator Program',    foto: '' },
      { nama: 'Nama Guru Pembimbing',  jabatan: 'Guru Pembimbing',         foto: '' }
    ],
    galeri: []
  }
];

/** GET /move — halaman index semua jurusan */
exports.moveIndex = async (req, res) => {
  try {
    res.render('frontend/move-index', {
      title: 'MOVE – Melayani Komunitas Via Edukasi',
      allJurusan: MOVE_JURUSAN
    });
  } catch (err) {
    console.error('MOVE index error:', err);
    res.status(500).send('Terjadi kesalahan');
  }
};

/** GET /move/:slug — landing page per jurusan */
exports.moveJurusan = async (req, res) => {
  try {
    const slug    = req.params.slug;
    const jurusan = MOVE_JURUSAN.find(j => j.slug === slug);
    if (!jurusan) return res.redirect('/move');

    res.render('frontend/move', {
      title: `MOVE – ${jurusan.nama} | SMKN 1 Kras`,
      jurusan,
      allJurusan: MOVE_JURUSAN
    });
  } catch (err) {
    console.error('MOVE jurusan error:', err);
    res.status(500).send('Terjadi kesalahan');
  }
};
