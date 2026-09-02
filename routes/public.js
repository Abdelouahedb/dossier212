const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const marked = require('marked');

// Helper to fetch multiple rows safely
function fetchAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper to fetch single row safely
function fetchOne(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

router.get('/', async (req, res) => {
  const db = await getDb();
  
  const featured = fetchOne(db, "SELECT * FROM dossiers WHERE est_a_la_une = 1 AND est_publie = 1 LIMIT 1");
  const latest = fetchAll(db, "SELECT * FROM dossiers WHERE est_publie = 1 ORDER BY date_publication DESC LIMIT 6");
  
  const categoriesList = ['maroc', 'monde', 'disparitions', 'non-resolus', 'archives', 'justice'];
  const categories = {};
  
  categoriesList.forEach(cat => {
    categories[cat] = fetchAll(db, "SELECT * FROM dossiers WHERE categorie = ? AND est_publie = 1 LIMIT 4", [cat]);
  });
  
  res.render('public/index', { featured, latest, categories });
});

router.get('/dossier/:slug', async (req, res) => {
  const db = await getDb();
  const dossier = fetchOne(db, "SELECT * FROM dossiers WHERE slug = ? AND est_publie = 1", [req.params.slug]);
  
  if (!dossier) {
    return res.status(404).render('public/error', { message: 'Dossier non trouvé' });
  }
  
  const personnes = fetchAll(db, "SELECT * FROM personnes WHERE dossier_id = ?", [dossier.id]);
  const chronologie = fetchAll(db, "SELECT * FROM chronologie WHERE dossier_id = ? ORDER BY ordre", [dossier.id]);
  const images = fetchAll(db, "SELECT * FROM images WHERE dossier_id = ?", [dossier.id]);
  
  const lang = res.locals.lang;
  const intro = lang === 'en' && dossier.introduction_en ? dossier.introduction_en : dossier.introduction_fr;
  const content = lang === 'en' && dossier.contenu_en ? dossier.contenu_en : dossier.contenu_fr;
  
  const renderedIntro = marked.parse(intro || '');
  const renderedContent = marked.parse(content || '');
  const renderedSources = marked.parse(dossier.sources || '');
  
  res.render('public/dossier', { dossier, personnes, chronologie, images, renderedIntro, renderedContent, renderedSources });
});

router.get('/categorie/:cat', async (req, res) => {
  const db = await getDb();
  const validCats = ['maroc', 'monde', 'disparitions', 'non-resolus', 'archives', 'justice'];
  let cat = req.params.cat;
  
  if (!validCats.includes(cat)) {
    return res.status(404).render('public/error', { message: 'Catégorie non valide' });
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;
  
  const countRow = fetchOne(db, "SELECT COUNT(*) as count FROM dossiers WHERE categorie = ? AND est_publie = 1", [cat]);
  const totalPages = Math.ceil((countRow ? countRow.count : 0) / limit);
  
  const dossiers = fetchAll(db, "SELECT * FROM dossiers WHERE categorie = ? AND est_publie = 1 ORDER BY date_publication DESC LIMIT ? OFFSET ?", [cat, limit, offset]);
  
  res.render('public/categorie', { categorie: cat, dossiers, page, totalPages });
});

router.get('/a-propos', (req, res) => {
  res.render('public/a-propos');
});

router.get('/set-lang/:lang', (req, res) => {
  const lang = req.params.lang === 'en' ? 'en' : 'fr';
  res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  res.redirect(req.get('referer') || '/');
});

router.get('/set-theme/:theme', (req, res) => {
  const theme = req.params.theme === 'light' ? 'light' : 'dark';
  res.cookie('theme', theme, { maxAge: 900000, httpOnly: true });
  res.redirect(req.get('referer') || '/');
});

module.exports = router;
