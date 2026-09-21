# 🏫 Website Resmi SMK Negeri 1 Kras

Website sekolah modern berbasis **Node.js + Express + MySQL**, dilengkapi panel admin lengkap, portal guru, dan fitur real-time jadwal KBM.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## ✨ Fitur Utama

### 🌐 Frontend Publik
- Beranda dengan slider, berita terkini, galeri, dan jurusan
- Profil sekolah (visi misi, sejarah, sambutan kepala sekolah)
- Halaman berita dengan pagination
- Data guru & staff
- Halaman program keahlian (jurusan) dinamis
- Media sosial (YouTube, TikTok, Instagram, Facebook)
- **Jam KBM real-time** — menampilkan jam pelajaran yang sedang berlangsung beserta countdown, mendukung mode Upacara / Tanpa Upacara

### 🔧 Panel Admin (`/admin`)
- Dashboard statistik
- Kelola berita, galeri, slider
- Kelola guru & staff (import/export Excel, sinkronisasi CBT)
- Kelola siswa
- Kelola jurusan & program keahlian
- Kelola menu navigasi
- Kelola halaman dinamis
- Profil & pengaturan website
- Maintenance mode

### 👨‍🏫 Portal Guru (`/guru/login`)
- Login khusus guru
- Edit profil sendiri (foto, data diri)
- Ganti password

---

## 🛠️ Teknologi

| Layer | Stack |
|---|---|
| Backend | Node.js, Express.js |
| Database | MySQL (mysql2) |
| Template | EJS |
| Frontend | Bootstrap 5, SB Admin 2 |
| Upload | Multer + Sharp (kompresi otomatis) |
| Auth | Express Session + bcrypt |
| Security | Helmet, CSRF, Rate Limit, XSS Clean |
| Process Manager | PM2 |

---

## 🚀 Instalasi Lokal

### 1. Clone repository
```bash
git clone git@github-atahalia:atahalia/website.git
cd website
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup database MySQL
```sql
CREATE DATABASE sekolah_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER 'smkn1kras'@'localhost' IDENTIFIED BY 'password_anda';
GRANT ALL PRIVILEGES ON sekolah_db.* TO 'smkn1kras'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Konfigurasi environment
```bash
cp .env.example .env
```
Edit `.env` sesuai konfigurasi lokal Anda:
```env
DB_HOST=localhost
DB_USER=smkn1kras
DB_PASSWORD=password_anda
DB_NAME=sekolah_db
SESSION_SECRET=ganti_dengan_string_acak_panjang
PORT=3000
```

### 5. Jalankan server
```bash
npm start
# atau development mode
npm run dev
```

Akses di `http://localhost:3000`

---

## 🔑 Akses Default

| Halaman | URL | Kredensial |
|---|---|---|
| Website | `/` | — |
| Panel Admin | `/admin` | `admin` / `admin123` |
| Portal Guru | `/guru/login` | NIP atau `guru{id}` / `smkn1kras` |

> ⚠️ **Ganti password default segera setelah instalasi!**

---

## 📁 Struktur Folder

```
├── assets/           # CSS, JS, gambar statis (SB Admin 2)
├── config/           # Konfigurasi koneksi database
├── controllers/      # Logic bisnis (admin, frontend, guru)
├── middleware/       # Auth, CSRF, security, upload
├── migrations/       # File migrasi database
├── routes/           # Definisi route Express
├── scripts/          # Script utilitas
├── tests/            # Unit & integration tests
├── utils/            # Helper functions
├── views/            # Template EJS
│   ├── admin/        # Halaman panel admin
│   ├── frontend/     # Halaman publik
│   └── guru/         # Portal guru
├── uploads/          # File yang diupload user
├── logs/             # Log aplikasi
├── server.js         # Entry point
├── ecosystem.config.js # Konfigurasi PM2
└── .env.example      # Template environment variables
```

---

## 🌍 Deploy ke VPS

Lihat panduan lengkap di [TUTORIAL_DEPLOY_VPS.md](TUTORIAL_DEPLOY_VPS.md)

### Perintah cepat setelah pull di VPS:
```bash
git pull origin main
npm install --production
pm2 restart website-sekolah
```

---

## 🔄 Workflow Update Kode

### Dari lokal (Windows/Mac/Linux):
```bash
git add .
git commit -m "feat: deskripsi perubahan"
git push origin main
```

### Di VPS setelah push:
```bash
cd /path/to/website
git pull origin main
pm2 restart website-sekolah
```

---

## 📄 Lisensi

MIT License — © SMK Negeri 1 Kras, Kediri, Jawa Timur
