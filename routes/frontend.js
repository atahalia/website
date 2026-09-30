const express = require('express');
const router = express.Router();
const frontendController = require('../controllers/frontendController');
const kontrolWebsiteController = require('../controllers/kontrolWebsiteController');
const { formLimiter } = require('../middleware/security');
const { validateSlugParam } = require('../middleware/securityHardening');

// Dynamic theme CSS (tidak kena maintenance)
router.get('/theme.css', kontrolWebsiteController.themeCss);

// Halaman offline untuk PWA
router.get('/offline', function (req, res) {
  res.render('frontend/offline', { title: 'Offline' });
});

// Google Search Console verification
router.get('/google49e50901a00a9978.html', function (req, res) {
  res.type('text/html');
  res.send('google-site-verification: google49e50901a00a9978.html');
});

router.get('/', frontendController.home);
router.get('/profil', frontendController.profil);
router.get('/profil/visi-misi', frontendController.visiMisi);
router.get('/profil/sejarah', frontendController.sejarah);
router.get('/profil/sambutan', frontendController.sambutan);
router.get('/profil/kepala-sekolah', frontendController.sambutanKepsek);
router.get('/berita', frontendController.berita);
router.get('/berita/:slug', validateSlugParam, frontendController.beritaDetail);
router.get('/galeri', frontendController.galeri);
router.get('/guru', frontendController.guru);
router.get('/guru/:id', frontendController.guruDetail);
router.get('/kontak', frontendController.kontakPage);
router.post('/kontak', formLimiter, frontendController.kontakSubmit);
router.get('/media-sosial', frontendController.mediaSosial);

// Alumni
const alumniController = require('../controllers/alumniController');
const { csrfProtect } = require('../middleware/csrf');
router.get('/alumni', alumniController.frontendIndex);
router.get('/alumni/daftar', alumniController.registerPage);
router.post('/alumni/daftar', formLimiter, csrfProtect, alumniController.register);
router.get('/alumni/update', alumniController.updatePage);
router.get('/alumni/edit/:token', alumniController.editPage);
router.post('/alumni/edit/:token', formLimiter, csrfProtect, alumniController.editSubmit);

// Prestasi, BKK, OSIS
const portalController = require('../controllers/portalController');
router.get('/prestasi', portalController.prestasiIndex);
router.get('/prestasi/:slug', validateSlugParam, portalController.prestasiDetail);
router.get('/bkk', portalController.bkkIndex);
router.get('/bkk/:slug', validateSlugParam, portalController.bkkDetail);
router.get('/osis', portalController.osisIndex);
router.get('/osis/berita/:slug', validateSlugParam, portalController.osisBeritaDetail);
router.get('/osis/:slug', validateSlugParam, portalController.osisDetail);
router.get('/pramuka', portalController.pramukaIndex);
router.get('/pramuka/berita/:slug', validateSlugParam, portalController.pramukaBeritaDetail);
router.get('/pramuka/:slug', validateSlugParam, portalController.pramukaDetail);
router.get('/olahraga', portalController.olahragaIndex);
router.get('/olahraga/berita/:slug', validateSlugParam, portalController.olahragaBeritaDetail);
router.get('/olahraga/:slug', validateSlugParam, portalController.olahragaDetail);
router.get('/paskibraka', portalController.paskibrakaIndex);
router.get('/paskibraka/berita/:slug', validateSlugParam, portalController.paskibrakaBeritaDetail);
router.get('/paskibraka/:slug', validateSlugParam, portalController.paskibrakaDetail);

// Seni
router.get('/seni', portalController.seniIndex);
router.get('/seni/berita/:slug', validateSlugParam, portalController.seniBeritaDetail);
router.get('/seni/:slug', validateSlugParam, portalController.seniDetail);

// Bahasa Asing
router.get('/bahasa-asing', portalController.bahasaAsingIndex);
router.get('/bahasa-asing/berita/:slug', validateSlugParam, portalController.bahasaAsingBeritaDetail);
router.get('/bahasa-asing/:slug', validateSlugParam, portalController.bahasaAsingDetail);

// Rohis
router.get('/rohis', portalController.rohisIndex);
router.get('/rohis/berita/:slug', validateSlugParam, portalController.rohisBeritaDetail);
router.get('/rohis/:slug', validateSlugParam, portalController.rohisDetail);

// PMR
router.get('/pmr', portalController.pmrIndex);
router.get('/pmr/berita/:slug', validateSlugParam, portalController.pmrBeritaDetail);
router.get('/pmr/:slug', validateSlugParam, portalController.pmrDetail);

// PIK-R
router.get('/pikr', portalController.pikrIndex);
router.get('/pikr/berita/:slug', validateSlugParam, portalController.pikrBeritaDetail);
router.get('/pikr/:slug', validateSlugParam, portalController.pikrDetail);

// Pecinta Alam
router.get('/pecinta-alam', portalController.pecintaAlamIndex);
router.get('/pecinta-alam/berita/:slug', validateSlugParam, portalController.pecintaAlamBeritaDetail);
router.get('/pecinta-alam/:slug', validateSlugParam, portalController.pecintaAlamDetail);

// Pencak Silat
router.get('/pencak-silat', portalController.pencakSilatIndex);
router.get('/pencak-silat/berita/:slug', validateSlugParam, portalController.pencakSilatBeritaDetail);
router.get('/pencak-silat/:slug', validateSlugParam, portalController.pencakSilatDetail);

// Fasilitas
router.get('/fasilitas', portalController.fasilitasIndex);

// Halaman Jurusan (dinamis dari DB)
router.get('/jurusan', portalController.jurusanListPage);
router.get('/jurusan/:kode', portalController.jurusanDetailPage);
router.get('/jurusan/:kode/berita/:slug', validateSlugParam, portalController.jurusanBeritaDetailPage);

// Halaman dinamis - harus di paling bawah
const halamanController = require('../controllers/halamanController');
router.get('/page/:slug', validateSlugParam, halamanController.show);

// Artikel
const artikelController = require('../controllers/artikelController');
router.get('/artikel', artikelController.frontendIndex);
router.get('/artikel/:slug', validateSlugParam, artikelController.frontendDetail);

// Agenda
const agendaController = require('../controllers/agendaController');
router.get('/agenda', agendaController.frontendIndex);
router.get('/agenda/:slug', validateSlugParam, agendaController.frontendDetail);

// File Download
const fileDownloadController = require('../controllers/fileDownloadController');
router.get('/file-download', fileDownloadController.frontendIndex);
router.get('/file-download/:id', fileDownloadController.frontendDownload);

// Halaman Ekstrakurikuler
router.get('/ekstrakurikuler', portalController.ekstrakurikulerIndex);

// SEO
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send([
    'User-agent: *',
    'Allow: /',
    '',
    '# Halaman admin - tidak perlu diindex',
    'Disallow: /admin',
    'Disallow: /guru/portal',
    '',
    '# Login portal operator ekskul - tidak perlu diindex',
    'Disallow: /bkk/login',
    'Disallow: /osis/login',
    'Disallow: /pramuka/login',
    'Disallow: /olahraga/login',
    'Disallow: /paskibraka/login',
    'Disallow: /seni/login',
    'Disallow: /bahasa-asing/login',
    'Disallow: /rohis/login',
    'Disallow: /pmr/login',
    'Disallow: /pikr/login',
    'Disallow: /pecinta-alam/login',
    'Disallow: /pencak-silat/login',
    'Disallow: /jurusan-portal',
    '',
    '# Dashboard portal - tidak perlu diindex',
    'Disallow: /bkk/dashboard',
    'Disallow: /osis/dashboard',
    'Disallow: /pramuka/dashboard',
    'Disallow: /olahraga/dashboard',
    'Disallow: /paskibraka/dashboard',
    'Disallow: /seni/dashboard',
    'Disallow: /bahasa-asing/dashboard',
    'Disallow: /rohis/dashboard',
    'Disallow: /pmr/dashboard',
    'Disallow: /pikr/dashboard',
    'Disallow: /pecinta-alam/dashboard',
    'Disallow: /pencak-silat/dashboard',
    '',
    'Sitemap: https://smkn1kras.sch.id/sitemap.xml'
  ].join('\n'));
});

router.get('/sitemap.xml', async (req, res) => {
  try {
    const db = require('../config/database');
    const baseUrl = 'https://smkn1kras.sch.id';
    const now = new Date().toISOString().split('T')[0];

    // Encode URL agar karakter spesial tidak merusak XML
    function safeUrl(url) {
      return url
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    const [[berita], [artikel], [jurusan], [halaman], [agenda], [prestasi]] = await Promise.all([
      db.query("SELECT slug, updated_at FROM berita WHERE status='published' AND slug IS NOT NULL AND slug != '' ORDER BY updated_at DESC"),
      db.query("SELECT slug, updated_at FROM artikel WHERE status='published' AND slug IS NOT NULL AND slug != '' ORDER BY updated_at DESC"),
      db.query("SELECT kode FROM jurusan WHERE status='aktif' AND kode IS NOT NULL"),
      db.query("SELECT slug FROM halaman WHERE status='aktif' AND slug IS NOT NULL AND slug != ''"),
      db.query("SELECT slug FROM agenda WHERE status='aktif' AND slug IS NOT NULL AND slug != ''"),
      db.query("SELECT slug FROM prestasi WHERE status='published' AND slug IS NOT NULL AND slug != ''"),
    ]);

    const staticPages = [
      { url: '/',               pri: '1.0', freq: 'daily'   },
      { url: '/berita',         pri: '0.9', freq: 'daily'   },
      { url: '/profil',         pri: '0.8', freq: 'monthly' },
      { url: '/jurusan',        pri: '0.8', freq: 'monthly' },
      { url: '/galeri',         pri: '0.7', freq: 'weekly'  },
      { url: '/prestasi',       pri: '0.7', freq: 'weekly'  },
      { url: '/fasilitas',      pri: '0.7', freq: 'monthly' },
      { url: '/guru',           pri: '0.6', freq: 'monthly' },
      { url: '/ekstrakurikuler',pri: '0.7', freq: 'monthly' },
      { url: '/bkk',            pri: '0.7', freq: 'weekly'  },
      { url: '/alumni',         pri: '0.6', freq: 'monthly' },
      { url: '/artikel',        pri: '0.7', freq: 'weekly'  },
      { url: '/agenda',         pri: '0.7', freq: 'weekly'  },
      { url: '/osis',           pri: '0.6', freq: 'monthly' },
      { url: '/pramuka',        pri: '0.6', freq: 'monthly' },
      { url: '/pmr',            pri: '0.6', freq: 'monthly' },
      { url: '/paskibraka',     pri: '0.6', freq: 'monthly' },
      { url: '/olahraga',       pri: '0.6', freq: 'monthly' },
      { url: '/seni',           pri: '0.6', freq: 'monthly' },
      { url: '/bahasa-asing',   pri: '0.6', freq: 'monthly' },
      { url: '/rohis',          pri: '0.6', freq: 'monthly' },
      { url: '/pikr',           pri: '0.6', freq: 'monthly' },
      { url: '/pecinta-alam',   pri: '0.6', freq: 'monthly' },
      { url: '/pencak-silat',   pri: '0.6', freq: 'monthly' },
      { url: '/kontak',         pri: '0.5', freq: 'monthly' },
    ];

    const urlEntries = [];

    staticPages.forEach(p => {
      urlEntries.push(`  <url>
    <loc>${baseUrl}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.pri}</priority>
  </url>`);
    });

    berita.forEach(b => {
      if (!b.slug) return;
      const d = b.updated_at ? new Date(b.updated_at).toISOString().split('T')[0] : now;
      urlEntries.push(`  <url>
    <loc>${safeUrl(`${baseUrl}/berita/${b.slug}`)}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    artikel.forEach(a => {
      if (!a.slug) return;
      const d = a.updated_at ? new Date(a.updated_at).toISOString().split('T')[0] : now;
      urlEntries.push(`  <url>
    <loc>${safeUrl(`${baseUrl}/artikel/${a.slug}`)}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    });

    jurusan.forEach(j => {
      if (!j.kode) return;
      urlEntries.push(`  <url>
    <loc>${safeUrl(`${baseUrl}/jurusan/${j.kode.toLowerCase()}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    halaman.forEach(h => {
      if (!h.slug) return;
      urlEntries.push(`  <url>
    <loc>${safeUrl(`${baseUrl}/page/${h.slug}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    });

    agenda.forEach(a => {
      if (!a.slug) return;
      urlEntries.push(`  <url>
    <loc>${safeUrl(`${baseUrl}/agenda/${a.slug}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    });

    prestasi.forEach(p => {
      if (!p.slug) return;
      urlEntries.push(`  <url>
    <loc>${safeUrl(`${baseUrl}/prestasi/${p.slug}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1 jam
    res.send(xml);
  } catch (e) {
    console.error('Sitemap error:', e);
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

// ── MOVE – Melayani Komunitas Via Edukasi ──────────────────────────────────
router.get('/move', frontendController.moveIndex);
router.get('/move/:slug', frontendController.moveJurusan);

module.exports = router;
