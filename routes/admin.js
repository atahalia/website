const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin, isPengelola } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const beritaController = require('../controllers/beritaController');
const galeriController = require('../controllers/galeriController');
const guruController = require('../controllers/guruController');
const sliderController = require('../controllers/sliderController');
const mediaSosialController = require('../controllers/mediaSosialController');
const userController = require('../controllers/userController');
const profilKontenController = require('../controllers/profilKontenController');
const halamanController = require('../controllers/halamanController');
const dataSekolahController = require('../controllers/dataSekolahController');
const kontrolWebsiteController = require('../controllers/kontrolWebsiteController');
const menuController = require('../controllers/menuController');
const linkTerkaitController = require('../controllers/linkTerkaitController');
const alumniController = require('../controllers/alumniController');
const portalController = require('../controllers/portalController');
const artikelController = require('../controllers/artikelController');
const fileDownloadController = require('../controllers/fileDownloadController');
const agendaController = require('../controllers/agendaController');
const skGuruController = require('../controllers/skGuruController');

const { loginLimiter, uploadLimiter, formLimiter } = require('../middleware/security');
const { csrfProtect } = require('../middleware/csrf');
const { validateIdParam, validateTipeParam } = require('../middleware/securityHardening');

// Siswa routes
router.use('/siswa', require('./siswa'));

// Jurusan routes
router.use('/jurusan', require('./jurusan'));

// Login routes - dilindungi rate limiter
router.get('/login', adminController.loginPage);
router.post('/login', loginLimiter, csrfProtect, adminController.login);
router.get('/logout', adminController.logout);

// Protected routes
router.get('/', isAuthenticated, adminController.dashboard);
router.get('/dashboard', isAuthenticated, adminController.dashboard);

// Profil Sekolah
router.get('/profil', isAuthenticated, adminController.profilPage);
router.post('/profil', isAuthenticated, csrfProtect, adminController.updateProfil);

// Berita
router.get('/berita', isAuthenticated, beritaController.index);
router.get('/berita/create', isAuthenticated, beritaController.createPage);
router.post('/berita/create', isAuthenticated, csrfProtect, uploadLimiter, beritaController.create);
router.get('/berita/edit/:id', isAuthenticated, validateIdParam, beritaController.editPage);
router.post('/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, beritaController.update);
router.post('/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, beritaController.delete);
router.post('/berita/upload-gambar', isAuthenticated, uploadLimiter, beritaController.uploadGambar);

// Galeri
router.get('/galeri', isAuthenticated, galeriController.index);
router.get('/galeri/create', isAuthenticated, galeriController.createPage);
router.post('/galeri/create', isAuthenticated, csrfProtect, galeriController.create);
router.get('/galeri/edit/:id', isAuthenticated, validateIdParam, galeriController.editPage);
router.post('/galeri/edit/:id', isAuthenticated, csrfProtect, validateIdParam, galeriController.update);
router.post('/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, galeriController.delete);
router.post('/galeri/delete-album', isAuthenticated, csrfProtect, galeriController.deleteAlbum);
router.post('/galeri/add-to-album', isAuthenticated, csrfProtect, galeriController.addToAlbum);

// Guru
router.get('/guru', isAuthenticated, guruController.index);
router.get('/guru/create', isAuthenticated, guruController.createPage);
router.post('/guru/create', isAuthenticated, csrfProtect, guruController.create);
router.get('/guru/edit/:id', isAuthenticated, validateIdParam, guruController.editPage);
router.post('/guru/edit/:id', isAuthenticated, csrfProtect, validateIdParam, guruController.update);
router.post('/guru/delete/:id', isAuthenticated, csrfProtect, validateIdParam, guruController.delete);
router.post('/guru/delete-foto/:id', isAuthenticated, csrfProtect, validateIdParam, guruController.deleteFoto);
router.get('/guru/sync-cbt', isAuthenticated, guruController.syncFromCBT);
router.post('/guru/reset-password-massal', isAuthenticated, csrfProtect, guruController.resetPasswordMassal);
router.get('/guru/export', isAuthenticated, guruController.exportExcel);
router.get('/guru/template', isAuthenticated, guruController.downloadTemplate);
router.post('/guru/import', isAuthenticated, csrfProtect, guruController.importExcel);

// Slider
router.get('/slider', isAuthenticated, sliderController.index);
router.get('/slider/create', isAuthenticated, sliderController.createPage);
router.post('/slider/create', isAuthenticated, csrfProtect, sliderController.create);
router.get('/slider/edit/:id', isAuthenticated, validateIdParam, sliderController.editPage);
router.post('/slider/edit/:id', isAuthenticated, csrfProtect, validateIdParam, sliderController.update);
router.post('/slider/delete/:id', isAuthenticated, csrfProtect, validateIdParam, sliderController.delete);

// Media Sosial
router.get('/media-sosial', isAuthenticated, mediaSosialController.index);
router.get('/media-sosial/create', isAuthenticated, mediaSosialController.create);
router.post('/media-sosial/create', isAuthenticated, csrfProtect, mediaSosialController.store);
router.get('/media-sosial/edit/:id', isAuthenticated, validateIdParam, mediaSosialController.edit);
router.post('/media-sosial/edit/:id', isAuthenticated, csrfProtect, validateIdParam, mediaSosialController.update);
router.post('/media-sosial/delete/:id', isAuthenticated, csrfProtect, validateIdParam, mediaSosialController.destroy);

// Kontak Masuk
router.get('/kontak', isAuthenticated, adminController.kontakMasuk);
router.post('/kontak/update-status/:id', isAuthenticated, csrfProtect, validateIdParam, adminController.updateStatusKontak);
router.post('/kontak/delete/:id', isAuthenticated, csrfProtect, validateIdParam, adminController.deleteKontak);
router.post('/kontak/bulk-delete', isAuthenticated, csrfProtect, adminController.bulkDeleteKontak);

// Manajemen User
router.get('/users', isAuthenticated, isAdmin, userController.index);
router.get('/users/create', isAuthenticated, isAdmin, userController.createPage);
router.post('/users/create', isAuthenticated, isAdmin, csrfProtect, userController.create);
router.get('/users/edit/:id', isAuthenticated, isAdmin, validateIdParam, userController.editPage);
router.post('/users/edit/:id', isAuthenticated, isAdmin, csrfProtect, validateIdParam, userController.update);
router.post('/users/delete/:id', isAuthenticated, isAdmin, csrfProtect, validateIdParam, userController.delete);

// Profil Konten
router.get('/profil-konten/:tipe', isAuthenticated, validateTipeParam, profilKontenController.editPage);
router.post('/profil-konten/:tipe', isAuthenticated, csrfProtect, validateTipeParam, profilKontenController.update);

// Data Sekolah
router.get('/data-sekolah', isAuthenticated, dataSekolahController.index);

// Kontrol Website
router.get('/kontrol-website', isAuthenticated, isAdmin, kontrolWebsiteController.index);
router.post('/kontrol-website/tampilan', isAuthenticated, isAdmin, csrfProtect, kontrolWebsiteController.saveTampilan);
router.post('/kontrol-website/editorial', isAuthenticated, isAdmin, csrfProtect, kontrolWebsiteController.saveEditorial);
router.post('/kontrol-website/statistik', isAuthenticated, isAdmin, csrfProtect, kontrolWebsiteController.saveStats);
router.post('/kontrol-website/maintenance', isAuthenticated, isAdmin, csrfProtect, kontrolWebsiteController.toggleMaintenance);

// Kelola Halaman Dinamis
router.get('/halaman', isAuthenticated, halamanController.index);
router.get('/halaman/create', isAuthenticated, halamanController.createPage);
router.post('/halaman/create', isAuthenticated, csrfProtect, halamanController.create);
router.get('/halaman/edit/:id', isAuthenticated, validateIdParam, halamanController.editPage);
router.post('/halaman/edit/:id', isAuthenticated, csrfProtect, validateIdParam, halamanController.update);
router.post('/halaman/delete/:id', isAuthenticated, csrfProtect, validateIdParam, halamanController.delete);

// Prestasi
router.get('/prestasi', isAuthenticated, portalController.adminPrestasiIndex);
router.get('/prestasi/create', isAuthenticated, portalController.adminPrestasiCreatePage);
router.post('/prestasi/create', isAuthenticated, csrfProtect, portalController.adminPrestasiCreate);
router.get('/prestasi/edit/:id', isAuthenticated, validateIdParam, portalController.adminPrestasiEditPage);
router.post('/prestasi/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPrestasiUpdate);
router.post('/prestasi/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPrestasiDelete);

// Admin kelola BKK
router.get('/bkk', isAuthenticated, portalController.adminBkkIndex);
router.get('/bkk/create', isAuthenticated, portalController.adminBkkCreatePage);
router.post('/bkk/create', isAuthenticated, csrfProtect, portalController.adminBkkCreate);
router.get('/bkk/edit/:id', isAuthenticated, validateIdParam, portalController.adminBkkEditPage);
router.post('/bkk/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminBkkUpdate);
router.post('/bkk/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminBkkDelete);

// Admin kelola OSIS
router.get('/osis', isAuthenticated, portalController.adminOsisIndex);
router.get('/osis/create', isAuthenticated, portalController.adminOsisCreatePage);
router.post('/osis/create', isAuthenticated, csrfProtect, portalController.adminOsisCreate);
router.get('/osis/edit/:id', isAuthenticated, validateIdParam, portalController.adminOsisEditPage);
router.post('/osis/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminOsisUpdate);
router.post('/osis/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminOsisDelete);

// Admin OSIS - Berita
router.get('/osis/berita', isAuthenticated, portalController.adminOsisBeritaIndex);
router.get('/osis/berita/create', isAuthenticated, portalController.adminOsisBeritaCreatePage);
router.post('/osis/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminOsisBeritaCreate);
router.get('/osis/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminOsisBeritaEditPage);
router.post('/osis/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminOsisBeritaUpdate);
router.post('/osis/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminOsisBeritaDelete);

// Admin OSIS - Galeri
router.get('/osis/galeri', isAuthenticated, portalController.adminOsisGaleriIndex);
router.post('/osis/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminOsisGaleriCreate);
router.post('/osis/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminOsisGaleriDelete);

// ── ADMIN EKSTRAKURIKULER ────────────────────────────────────────────────────

// Admin PRAMUKA
router.get('/pramuka', isAuthenticated, portalController.adminPramukaIndex);
router.get('/pramuka/create', isAuthenticated, portalController.adminPramukaCreatePage);
router.post('/pramuka/create', isAuthenticated, csrfProtect, portalController.adminPramukaCreate);
router.get('/pramuka/edit/:id', isAuthenticated, validateIdParam, portalController.adminPramukaEditPage);
router.post('/pramuka/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPramukaUpdate);
router.post('/pramuka/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPramukaDelete);
router.get('/pramuka/berita', isAuthenticated, portalController.adminPramukaBeritaIndex);
router.get('/pramuka/berita/create', isAuthenticated, portalController.adminPramukaBeritaCreatePage);
router.post('/pramuka/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPramukaBeritaCreate);
router.get('/pramuka/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminPramukaBeritaEditPage);
router.post('/pramuka/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminPramukaBeritaUpdate);
router.post('/pramuka/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPramukaBeritaDelete);
router.get('/pramuka/galeri', isAuthenticated, portalController.adminPramukaGaleriIndex);
router.post('/pramuka/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPramukaGaleriCreate);
router.post('/pramuka/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPramukaGaleriDelete);

// Admin OLAHRAGA
router.get('/olahraga', isAuthenticated, portalController.adminOlahragaIndex);
router.get('/olahraga/create', isAuthenticated, portalController.adminOlahragaCreatePage);
router.post('/olahraga/create', isAuthenticated, csrfProtect, portalController.adminOlahragaCreate);
router.get('/olahraga/edit/:id', isAuthenticated, validateIdParam, portalController.adminOlahragaEditPage);
router.post('/olahraga/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminOlahragaUpdate);
router.post('/olahraga/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminOlahragaDelete);
router.get('/olahraga/berita', isAuthenticated, portalController.adminOlahragaBeritaIndex);
router.get('/olahraga/berita/create', isAuthenticated, portalController.adminOlahragaBeritaCreatePage);
router.post('/olahraga/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminOlahragaBeritaCreate);
router.get('/olahraga/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminOlahragaBeritaEditPage);
router.post('/olahraga/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminOlahragaBeritaUpdate);
router.post('/olahraga/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminOlahragaBeritaDelete);
router.get('/olahraga/galeri', isAuthenticated, portalController.adminOlahragaGaleriIndex);
router.post('/olahraga/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminOlahragaGaleriCreate);
router.post('/olahraga/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminOlahragaGaleriDelete);

// Admin PASKIBRAKA
router.get('/paskibraka', isAuthenticated, portalController.adminPaskibrakaIndex);
router.get('/paskibraka/create', isAuthenticated, portalController.adminPaskibrakaCreatePage);
router.post('/paskibraka/create', isAuthenticated, csrfProtect, portalController.adminPaskibrakaCreate);
router.get('/paskibraka/edit/:id', isAuthenticated, validateIdParam, portalController.adminPaskibrakaEditPage);
router.post('/paskibraka/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPaskibrakaUpdate);
router.post('/paskibraka/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPaskibrakaDelete);
router.get('/paskibraka/berita', isAuthenticated, portalController.adminPaskibrakaBeritaIndex);
router.get('/paskibraka/berita/create', isAuthenticated, portalController.adminPaskibrakaBeritaCreatePage);
router.post('/paskibraka/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPaskibrakaBeritaCreate);
router.get('/paskibraka/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminPaskibrakaBeritaEditPage);
router.post('/paskibraka/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminPaskibrakaBeritaUpdate);
router.post('/paskibraka/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPaskibrakaBeritaDelete);
router.get('/paskibraka/galeri', isAuthenticated, portalController.adminPaskibrakaGaleriIndex);
router.post('/paskibraka/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPaskibrakaGaleriCreate);
router.post('/paskibraka/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPaskibrakaGaleriDelete);

// Admin SENI
router.get('/seni', isAuthenticated, portalController.adminSeniIndex);
router.get('/seni/create', isAuthenticated, portalController.adminSeniCreatePage);
router.post('/seni/create', isAuthenticated, csrfProtect, portalController.adminSeniCreate);
router.get('/seni/edit/:id', isAuthenticated, validateIdParam, portalController.adminSeniEditPage);
router.post('/seni/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminSeniUpdate);
router.post('/seni/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminSeniDelete);
router.get('/seni/berita', isAuthenticated, portalController.adminSeniBeritaIndex);
router.get('/seni/berita/create', isAuthenticated, portalController.adminSeniBeritaCreatePage);
router.post('/seni/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminSeniBeritaCreate);
router.get('/seni/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminSeniBeritaEditPage);
router.post('/seni/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminSeniBeritaUpdate);
router.post('/seni/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminSeniBeritaDelete);
router.get('/seni/galeri', isAuthenticated, portalController.adminSeniGaleriIndex);
router.post('/seni/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminSeniGaleriCreate);
router.post('/seni/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminSeniGaleriDelete);

// Admin BAHASA ASING
router.get('/bahasa-asing', isAuthenticated, portalController.adminBahasaAsingIndex);
router.get('/bahasa-asing/create', isAuthenticated, portalController.adminBahasaAsingCreatePage);
router.post('/bahasa-asing/create', isAuthenticated, csrfProtect, portalController.adminBahasaAsingCreate);
router.get('/bahasa-asing/edit/:id', isAuthenticated, validateIdParam, portalController.adminBahasaAsingEditPage);
router.post('/bahasa-asing/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminBahasaAsingUpdate);
router.post('/bahasa-asing/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminBahasaAsingDelete);
router.get('/bahasa-asing/berita', isAuthenticated, portalController.adminBahasaAsingBeritaIndex);
router.get('/bahasa-asing/berita/create', isAuthenticated, portalController.adminBahasaAsingBeritaCreatePage);
router.post('/bahasa-asing/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminBahasaAsingBeritaCreate);
router.get('/bahasa-asing/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminBahasaAsingBeritaEditPage);
router.post('/bahasa-asing/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminBahasaAsingBeritaUpdate);
router.post('/bahasa-asing/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminBahasaAsingBeritaDelete);
router.get('/bahasa-asing/galeri', isAuthenticated, portalController.adminBahasaAsingGaleriIndex);
router.post('/bahasa-asing/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminBahasaAsingGaleriCreate);
router.post('/bahasa-asing/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminBahasaAsingGaleriDelete);

// Admin ROHIS
router.get('/rohis', isAuthenticated, portalController.adminRohisIndex);
router.get('/rohis/create', isAuthenticated, portalController.adminRohisCreatePage);
router.post('/rohis/create', isAuthenticated, csrfProtect, portalController.adminRohisCreate);
router.get('/rohis/edit/:id', isAuthenticated, validateIdParam, portalController.adminRohisEditPage);
router.post('/rohis/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminRohisUpdate);
router.post('/rohis/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminRohisDelete);
router.get('/rohis/berita', isAuthenticated, portalController.adminRohisBeritaIndex);
router.get('/rohis/berita/create', isAuthenticated, portalController.adminRohisBeritaCreatePage);
router.post('/rohis/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminRohisBeritaCreate);
router.get('/rohis/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminRohisBeritaEditPage);
router.post('/rohis/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminRohisBeritaUpdate);
router.post('/rohis/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminRohisBeritaDelete);
router.get('/rohis/galeri', isAuthenticated, portalController.adminRohisGaleriIndex);
router.post('/rohis/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminRohisGaleriCreate);
router.post('/rohis/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminRohisGaleriDelete);

// Admin PMR
router.get('/pmr', isAuthenticated, portalController.adminPmrIndex);
router.get('/pmr/create', isAuthenticated, portalController.adminPmrCreatePage);
router.post('/pmr/create', isAuthenticated, csrfProtect, portalController.adminPmrCreate);
router.get('/pmr/edit/:id', isAuthenticated, validateIdParam, portalController.adminPmrEditPage);
router.post('/pmr/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPmrUpdate);
router.post('/pmr/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPmrDelete);
router.get('/pmr/berita', isAuthenticated, portalController.adminPmrBeritaIndex);
router.get('/pmr/berita/create', isAuthenticated, portalController.adminPmrBeritaCreatePage);
router.post('/pmr/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPmrBeritaCreate);
router.get('/pmr/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminPmrBeritaEditPage);
router.post('/pmr/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminPmrBeritaUpdate);
router.post('/pmr/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPmrBeritaDelete);
router.get('/pmr/galeri', isAuthenticated, portalController.adminPmrGaleriIndex);
router.post('/pmr/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPmrGaleriCreate);
router.post('/pmr/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPmrGaleriDelete);

// Admin PIK-R
router.get('/pikr', isAuthenticated, portalController.adminPikrIndex);
router.get('/pikr/create', isAuthenticated, portalController.adminPikrCreatePage);
router.post('/pikr/create', isAuthenticated, csrfProtect, portalController.adminPikrCreate);
router.get('/pikr/edit/:id', isAuthenticated, validateIdParam, portalController.adminPikrEditPage);
router.post('/pikr/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPikrUpdate);
router.post('/pikr/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPikrDelete);
router.get('/pikr/berita', isAuthenticated, portalController.adminPikrBeritaIndex);
router.get('/pikr/berita/create', isAuthenticated, portalController.adminPikrBeritaCreatePage);
router.post('/pikr/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPikrBeritaCreate);
router.get('/pikr/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminPikrBeritaEditPage);
router.post('/pikr/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminPikrBeritaUpdate);
router.post('/pikr/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPikrBeritaDelete);
router.get('/pikr/galeri', isAuthenticated, portalController.adminPikrGaleriIndex);
router.post('/pikr/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPikrGaleriCreate);
router.post('/pikr/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPikrGaleriDelete);

// Admin PECINTA ALAM
router.get('/pecinta-alam', isAuthenticated, portalController.adminPecintaAlamIndex);
router.get('/pecinta-alam/create', isAuthenticated, portalController.adminPecintaAlamCreatePage);
router.post('/pecinta-alam/create', isAuthenticated, csrfProtect, portalController.adminPecintaAlamCreate);
router.get('/pecinta-alam/edit/:id', isAuthenticated, validateIdParam, portalController.adminPecintaAlamEditPage);
router.post('/pecinta-alam/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPecintaAlamUpdate);
router.post('/pecinta-alam/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPecintaAlamDelete);
router.get('/pecinta-alam/berita', isAuthenticated, portalController.adminPecintaAlamBeritaIndex);
router.get('/pecinta-alam/berita/create', isAuthenticated, portalController.adminPecintaAlamBeritaCreatePage);
router.post('/pecinta-alam/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPecintaAlamBeritaCreate);
router.get('/pecinta-alam/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminPecintaAlamBeritaEditPage);
router.post('/pecinta-alam/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminPecintaAlamBeritaUpdate);
router.post('/pecinta-alam/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPecintaAlamBeritaDelete);
router.get('/pecinta-alam/galeri', isAuthenticated, portalController.adminPecintaAlamGaleriIndex);
router.post('/pecinta-alam/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPecintaAlamGaleriCreate);
router.post('/pecinta-alam/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPecintaAlamGaleriDelete);

// Admin PENCAK SILAT
router.get('/pencak-silat', isAuthenticated, portalController.adminPencakSilatIndex);
router.get('/pencak-silat/create', isAuthenticated, portalController.adminPencakSilatCreatePage);
router.post('/pencak-silat/create', isAuthenticated, csrfProtect, portalController.adminPencakSilatCreate);
router.get('/pencak-silat/edit/:id', isAuthenticated, validateIdParam, portalController.adminPencakSilatEditPage);
router.post('/pencak-silat/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPencakSilatUpdate);
router.post('/pencak-silat/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPencakSilatDelete);
router.get('/pencak-silat/berita', isAuthenticated, portalController.adminPencakSilatBeritaIndex);
router.get('/pencak-silat/berita/create', isAuthenticated, portalController.adminPencakSilatBeritaCreatePage);
router.post('/pencak-silat/berita/create', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPencakSilatBeritaCreate);
router.get('/pencak-silat/berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminPencakSilatBeritaEditPage);
router.post('/pencak-silat/berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, portalController.adminPencakSilatBeritaUpdate);
router.post('/pencak-silat/berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPencakSilatBeritaDelete);
router.get('/pencak-silat/galeri', isAuthenticated, portalController.adminPencakSilatGaleriIndex);
router.post('/pencak-silat/galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminPencakSilatGaleriCreate);
router.post('/pencak-silat/galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminPencakSilatGaleriDelete);

// Admin kelola Berita Jurusan
router.get('/jurusan-berita', isAuthenticated, portalController.adminJurusanBeritaIndex);
router.get('/jurusan-berita/create', isAuthenticated, portalController.adminJurusanBeritaCreatePage);
router.post('/jurusan-berita/create', isAuthenticated, csrfProtect, portalController.adminJurusanBeritaCreate);
router.get('/jurusan-berita/edit/:id', isAuthenticated, validateIdParam, portalController.adminJurusanBeritaEditPage);
router.post('/jurusan-berita/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminJurusanBeritaUpdate);
router.post('/jurusan-berita/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminJurusanBeritaDelete);

// Admin kelola Galeri Jurusan
router.get('/jurusan-galeri', isAuthenticated, portalController.adminJurusanGaleriIndex);
router.post('/jurusan-galeri/upload', isAuthenticated, csrfProtect, uploadLimiter, portalController.adminJurusanGaleriCreate);
router.post('/jurusan-galeri/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminJurusanGaleriDelete);

// Admin kelola Fasilitas Jurusan
router.get('/jurusan-fasilitas', isAuthenticated, portalController.adminJurusanFasilitasIndex);
router.post('/jurusan-fasilitas/create', isAuthenticated, csrfProtect, portalController.adminJurusanFasilitasCreate);
router.get('/jurusan-fasilitas/edit/:id', isAuthenticated, validateIdParam, portalController.adminJurusanFasilitasEditPage);
router.post('/jurusan-fasilitas/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminJurusanFasilitasUpdate);
router.post('/jurusan-fasilitas/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminJurusanFasilitasDelete);

// Fasilitas
router.get('/fasilitas', isAuthenticated, portalController.adminFasilitasIndex);
router.get('/fasilitas/create', isAuthenticated, portalController.adminFasilitasCreatePage);
router.post('/fasilitas/create', isAuthenticated, csrfProtect, portalController.adminFasilitasCreate);
router.get('/fasilitas/edit/:id', isAuthenticated, validateIdParam, portalController.adminFasilitasEditPage);
router.post('/fasilitas/edit/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminFasilitasUpdate);
router.post('/fasilitas/delete/:id', isAuthenticated, csrfProtect, validateIdParam, portalController.adminFasilitasDelete);

// Portal Users (BKK, OSIS, Jurusan)
router.get('/portal-users', isAuthenticated, isPengelola, portalController.adminPortalUsers);
router.post('/portal-users/create', isAuthenticated, isPengelola, csrfProtect, portalController.adminPortalUserCreate);
router.post('/portal-users/edit/:id', isAuthenticated, isPengelola, csrfProtect, validateIdParam, portalController.adminPortalUserEdit);
router.post('/portal-users/delete/:id', isAuthenticated, isPengelola, csrfProtect, validateIdParam, portalController.adminPortalUserDelete);
router.post('/portal-users/toggle/:id', isAuthenticated, isPengelola, csrfProtect, validateIdParam, portalController.adminPortalUserToggle);
router.get('/portal-users/export', isAuthenticated, isPengelola, portalController.adminPortalUserExport);
router.post('/portal-users/import', isAuthenticated, isPengelola, csrfProtect, portalController.adminPortalUserImport);

// Alumni
router.get('/alumni', isAuthenticated, alumniController.adminIndex);
router.get('/alumni/edit/:id', isAuthenticated, validateIdParam, alumniController.adminEditPage);
router.post('/alumni/edit/:id', isAuthenticated, csrfProtect, validateIdParam, alumniController.adminUpdate);
router.post('/alumni/setujui/:id', isAuthenticated, csrfProtect, validateIdParam, alumniController.adminSetujui);
router.post('/alumni/tolak/:id', isAuthenticated, csrfProtect, validateIdParam, alumniController.adminTolak);
router.post('/alumni/delete/:id', isAuthenticated, csrfProtect, validateIdParam, alumniController.adminDelete);

// Link Terkait
router.get('/link-terkait', isAuthenticated, linkTerkaitController.index);
router.get('/link-terkait/create', isAuthenticated, linkTerkaitController.createPage);
router.post('/link-terkait/create', isAuthenticated, csrfProtect, linkTerkaitController.create);
router.get('/link-terkait/edit/:id', isAuthenticated, validateIdParam, linkTerkaitController.editPage);
router.post('/link-terkait/edit/:id', isAuthenticated, csrfProtect, validateIdParam, linkTerkaitController.update);
router.post('/link-terkait/delete/:id', isAuthenticated, csrfProtect, validateIdParam, linkTerkaitController.destroy);

// Kelola Menu Navigasi
router.get('/menu', isAuthenticated, menuController.index);
router.get('/menu/create', isAuthenticated, menuController.createPage);
router.post('/menu/create', isAuthenticated, csrfProtect, menuController.create);
router.get('/menu/edit/:id', isAuthenticated, validateIdParam, menuController.editPage);
router.post('/menu/edit/:id', isAuthenticated, csrfProtect, validateIdParam, menuController.update);
router.post('/menu/delete/:id', isAuthenticated, csrfProtect, validateIdParam, menuController.delete);
router.post('/menu/toggle/:id', isAuthenticated, csrfProtect, validateIdParam, menuController.toggleStatus);

// Artikel
router.get('/artikel', isAuthenticated, artikelController.adminIndex);
router.get('/artikel/create', isAuthenticated, artikelController.adminCreatePage);
router.post('/artikel/create', isAuthenticated, csrfProtect, uploadLimiter, artikelController.adminCreate);
router.get('/artikel/edit/:id', isAuthenticated, validateIdParam, artikelController.adminEditPage);
router.post('/artikel/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, artikelController.adminUpdate);
router.post('/artikel/delete/:id', isAuthenticated, csrfProtect, validateIdParam, artikelController.adminDelete);

// File Download
router.get('/file-download', isAuthenticated, fileDownloadController.adminIndex);
router.get('/file-download/create', isAuthenticated, fileDownloadController.adminCreatePage);
router.post('/file-download/create', isAuthenticated, csrfProtect, uploadLimiter, fileDownloadController.adminCreate);
router.get('/file-download/edit/:id', isAuthenticated, validateIdParam, fileDownloadController.adminEditPage);
router.post('/file-download/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, fileDownloadController.adminUpdate);
router.post('/file-download/delete/:id', isAuthenticated, csrfProtect, validateIdParam, fileDownloadController.adminDelete);

// Agenda
router.get('/agenda', isAuthenticated, agendaController.adminIndex);
router.get('/agenda/create', isAuthenticated, agendaController.adminCreatePage);
router.post('/agenda/create', isAuthenticated, csrfProtect, uploadLimiter, agendaController.adminCreate);
router.get('/agenda/edit/:id', isAuthenticated, validateIdParam, agendaController.adminEditPage);
router.post('/agenda/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, agendaController.adminUpdate);
router.post('/agenda/delete/:id', isAuthenticated, csrfProtect, validateIdParam, agendaController.adminDelete);

// SK Guru (SK Mengajar & SK Tugas Tambahan)
router.get('/sk-guru', isAuthenticated, skGuruController.adminIndex);
router.get('/sk-guru/create', isAuthenticated, skGuruController.adminCreatePage);
router.post('/sk-guru/create', isAuthenticated, csrfProtect, uploadLimiter, skGuruController.adminCreate);
router.get('/sk-guru/detail/:id', isAuthenticated, validateIdParam, skGuruController.adminDetail);
router.get('/sk-guru/edit/:id', isAuthenticated, validateIdParam, skGuruController.adminEditPage);
router.post('/sk-guru/edit/:id', isAuthenticated, csrfProtect, validateIdParam, uploadLimiter, skGuruController.adminUpdate);
router.post('/sk-guru/delete/:id', isAuthenticated, csrfProtect, validateIdParam, skGuruController.adminDelete);

// ── MOVE – Melayani Komunitas Via Edukasi ────────────────────────────────────
const moveAdminController   = require('../controllers/moveAdminController');
const moveContentController = require('../controllers/moveContentController');

router.get('/move', isAuthenticated, moveAdminController.index);

// Tentang MOVE
router.get('/move/tentang',  isAuthenticated, moveAdminController.tentangPage);
router.post('/move/tentang', isAuthenticated, csrfProtect, moveAdminController.tentangSave);

// Program info
router.get('/move/:id/edit',  isAuthenticated, validateIdParam, moveAdminController.editPage);
router.post('/move/:id/edit', isAuthenticated, csrfProtect, validateIdParam, moveAdminController.editSave);

// Layanan
router.get('/move/:id/layanan',          isAuthenticated, validateIdParam, moveAdminController.layananPage);
router.post('/move/:id/layanan/add',     isAuthenticated, csrfProtect, validateIdParam, moveAdminController.layananAdd);
router.post('/move/layanan/:lid/edit',   isAuthenticated, csrfProtect, validateIdParam, moveAdminController.layananEdit);
router.post('/move/layanan/:lid/delete', isAuthenticated, csrfProtect, validateIdParam, moveAdminController.layananDelete);

// Media Sosial
router.get('/move/:id/sosmed',  isAuthenticated, validateIdParam, moveAdminController.sosmedPage);
router.post('/move/:id/sosmed', isAuthenticated, csrfProtect, validateIdParam, moveAdminController.sosmedSave);

// Galeri
router.get('/move/:id/galeri',            isAuthenticated, validateIdParam, moveAdminController.galeriPage);
router.post('/move/:id/galeri/upload',    isAuthenticated, csrfProtect, uploadLimiter, validateIdParam, moveAdminController.galeriUpload);
router.post('/move/galeri/:gid/delete',   isAuthenticated, csrfProtect, validateIdParam, moveAdminController.galeriDelete);

// Tim Pengelola
router.get('/move/:id/pengelola',              isAuthenticated, validateIdParam, moveAdminController.pengelolaPage);
router.post('/move/:id/pengelola/add',         isAuthenticated, csrfProtect, uploadLimiter, validateIdParam, moveAdminController.pengelolaAdd);
router.post('/move/pengelola/:pid/edit',       isAuthenticated, csrfProtect, uploadLimiter, validateIdParam, moveAdminController.pengelolaEdit);
router.post('/move/pengelola/:pid/delete',     isAuthenticated, csrfProtect, validateIdParam, moveAdminController.pengelolaDelete);

// ── MOVE Content: Proyek ─────────────────────────────────────────────────────
router.get('/move/:id/proyek',                isAuthenticated, validateIdParam, moveContentController.proyekPage);
router.get('/move/:id/proyek/create',         isAuthenticated, validateIdParam, moveContentController.proyekCreatePage);
router.post('/move/:id/proyek/create',        isAuthenticated, csrfProtect, uploadLimiter, validateIdParam, moveContentController.proyekCreate);
router.get('/move/:id/proyek/:pid/edit',      isAuthenticated, validateIdParam, moveContentController.proyekEditPage);
router.post('/move/:id/proyek/:pid/edit',     isAuthenticated, csrfProtect, uploadLimiter, validateIdParam, moveContentController.proyekUpdate);
router.post('/move/:id/proyek/:pid/delete',   isAuthenticated, csrfProtect, validateIdParam, moveContentController.proyekDelete);

// ── MOVE Content: Berita ─────────────────────────────────────────────────────
router.get('/move/:id/berita',                isAuthenticated, validateIdParam, moveContentController.beritaPage);
router.get('/move/:id/berita/create',         isAuthenticated, validateIdParam, moveContentController.beritaCreatePage);
router.post('/move/:id/berita/create',        isAuthenticated, csrfProtect, uploadLimiter, validateIdParam, moveContentController.beritaCreate);
router.get('/move/:id/berita/:bid/edit',      isAuthenticated, validateIdParam, moveContentController.beritaEditPage);
router.post('/move/:id/berita/:bid/edit',     isAuthenticated, csrfProtect, uploadLimiter, validateIdParam, moveContentController.beritaUpdate);
router.post('/move/:id/berita/:bid/delete',   isAuthenticated, csrfProtect, validateIdParam, moveContentController.beritaDelete);

// ── MOVE Content: Pelanggan/Peta ─────────────────────────────────────────────
router.get('/move/:id/pelanggan',             isAuthenticated, validateIdParam, moveContentController.pelangganPage);
router.post('/move/:id/pelanggan/add',        isAuthenticated, csrfProtect, validateIdParam, moveContentController.pelangganAdd);
router.post('/move/pelanggan/:klid/delete',   isAuthenticated, csrfProtect, validateIdParam, moveContentController.pelangganDelete);

module.exports = router;
