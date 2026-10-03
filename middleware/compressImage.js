const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PROFILES = {
  hero: { maxWidth: 1920, maxHeight: 860, quality: 80 },
  large: { maxWidth: 1400, maxHeight: 1050, quality: 78 },
  portrait: { maxWidth: 800, maxHeight: 1000, quality: 80 },
  thumb: { maxWidth: 600, maxHeight: 600, quality: 76 },
  default: { maxWidth: 1200, maxHeight: 900, quality: 75 }
};

function getCompressProfile(req) {
  const url = `${req.originalUrl || ''}${req.baseUrl || ''}${req.path || ''}`.toLowerCase();
  if (url.includes('/slider')) return 'hero';
  if (url.includes('/galeri') || url.includes('/fasilitas') || url.includes('/berita') ||
      url.includes('/artikel') || url.includes('/agenda') || url.includes('/prestasi') ||
      url.includes('/bkk') || url.includes('/halaman') || url.includes('/jurusan')) return 'large';
  if (url.includes('/guru') || url.includes('/alumni') || url.includes('/siswa') ||
      url.includes('/kepsek') || url.includes('/profil') || url.includes('/move-proyek') ||
      url.includes('/move/pengelola')) return 'portrait';
  if (url.includes('/link-terkait') || url.includes('/media-sosial')) return 'thumb';
  return 'default';
}

/**
 * Kompres gambar setelah upload multer selesai.
 * Output WebP (lebih ringan) kecuali SVG/GIF atau PNG transparan.
 */
const compressImage = async (req, res, next) => {
  try {
    const files = getUploadedFiles(req);
    if (!files.length) return next();

    const profile = getCompressProfile(req);
    const failed = [];

    await Promise.all(files.map(async (file) => {
      const ok = await compressFile(file, profile);
      if (!ok) failed.push(file.originalname);
    }));

    if (failed.length > 0) {
      getUploadedFiles(req).forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      return res.status(400).send(`
        <div style="font-family:sans-serif;padding:2rem;max-width:600px;margin:2rem auto;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;">
          <h3 style="color:#856404;">⚠️ Format Foto Tidak Didukung</h3>
          <p>File berikut tidak bisa diproses: <strong>${failed.join(', ')}</strong></p>
          <p>Foto dari iPhone meskipun berekstensi .jpg kadang masih berformat HEIC di dalamnya.</p>
          <p><strong>Solusi:</strong> Di iPhone buka foto → Share → Save to Files → pilih format JPEG. Atau screenshot foto tersebut lalu upload hasilnya.</p>
          <a href="javascript:history.back()" style="color:#0ea5e9;">← Kembali</a>
        </div>
      `);
    }

    next();
  } catch (err) {
    next(err);
  }
};

function getUploadedFiles(req) {
  if (req.file) return [req.file];
  if (!req.files) return [];
  if (Array.isArray(req.files)) return req.files;
  return Object.values(req.files).flat();
}

async function compressFile(file, profileName) {
  // Cek dari filename aktual di disk (bisa sudah .webp dari proses sebelumnya)
  const ext = path.extname(file.filename || file.originalname).toLowerCase();
  if (ext === '.svg' || ext === '.gif' || ext === '.webp') return true;

  const cfg = PROFILES[profileName] || PROFILES.default;
  const filePath = file.path;

  // Guard: file sudah tidak ada di disk (sudah diproses sebelumnya)
  if (!filePath || !fs.existsSync(filePath)) return true;
  const isHeic = ext === '.heic' || ext === '.heif';
  const baseNoExt = filePath.replace(/\.[^.]+$/i, '');
  const tmpPath = `${baseNoExt}.opt.tmp`;

  try {
    const meta = await sharp(filePath, { failOn: 'none' }).rotate().metadata();
    const keepPng = ext === '.png' && meta.hasAlpha;

    if (keepPng) {
      await sharp(filePath).rotate()
        .resize({ width: cfg.maxWidth, height: cfg.maxHeight, fit: 'inside', withoutEnlargement: true })
        .png({ quality: Math.min(cfg.quality, 80), compressionLevel: 6, palette: true })
        .toFile(tmpPath);
      fs.renameSync(tmpPath, filePath);
    } else {
      const webpPath = `${baseNoExt}.webp`;
      await sharp(filePath).rotate()
        .resize({ width: cfg.maxWidth, height: cfg.maxHeight, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: cfg.quality, effort: 2 })
        .toFile(tmpPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      fs.renameSync(tmpPath, webpPath);
      file.filename = path.basename(webpPath);
      file.path = webpPath;
    }

    if (isHeic && keepPng) {
      file.filename = path.basename(filePath);
    }

    return true;
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('Gagal kompres gambar:', file.filename, err.message);
    return false;
  }
}

module.exports = compressImage;
