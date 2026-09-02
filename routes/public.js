const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const marked = require('marked');

const markdownRenderer = new marked.Renderer();
const defaultRenderer = new marked.Renderer();

function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, 'https://dossier212.local');
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
      || (!url.includes(':') && (url.startsWith('/') || url.startsWith('#') || url.startsWith('./') || url.startsWith('../')));
  } catch {
    return false;
  }
}

// Dossiers are authored as Markdown. Raw HTML and unsafe link/image URLs are
// excluded before the generated HTML is passed to the EJS templates.
markdownRenderer.html = () => '';
markdownRenderer.link = function link(token) {
  return isSafeUrl(token.href) ? defaultRenderer.link.call(this, token) : this.parser.parseInline(token.tokens);
};
markdownRenderer.image = function image(token) {
  return isSafeUrl(token.href) ? defaultRenderer.image.call(this, token) : '';
};

function renderMarkdown(value) {
  return marked.parse(value || '', { renderer: markdownRenderer });
}

// Helper to fetch multiple rows safely
async function fetchAll(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i++); }
  const result = await db.query(pgSql, params);
  return result.rows;
}

// Helper to fetch single row safely
async function fetchOne(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i++); }
  const result = await db.query(pgSql, params);
  return result.rows[0] || null;
}

const dossierSelect = `
  SELECT dossiers.*,
    (SELECT chemin FROM images WHERE images.dossier_id = dossiers.id ORDER BY images.date_upload ASC LIMIT 1) AS cover_image
  FROM dossiers
`;

router.get('/', async (req, res) => {
  const db = await getDb();
  
  const featured = await fetchOne(db, `${dossierSelect} WHERE est_a_la_une = 1 AND est_publie = 1 LIMIT 1`);
  const latest = await fetchAll(db, `${dossierSelect} WHERE est_publie = 1 ORDER BY date_publication DESC LIMIT 6`);
  
  const categoriesList = ['maroc', 'monde', 'disparitions', 'non-resolus', 'archives', 'justice'];
  const categories = {};
  
  for (const cat of categoriesList) {
    categories[cat] = await fetchAll(db, `${dossierSelect} WHERE categorie = ? AND est_publie = 1 LIMIT 4`, [cat]);
  }
  
  res.render('public/index', { featured, latest, categories });
});

router.get('/dossier/:slug', async (req, res) => {
  const db = await getDb();
  const dossier = await fetchOne(db, "SELECT * FROM dossiers WHERE slug = ? AND est_publie = 1", [req.params.slug]);
  
  if (!dossier) {
    return res.status(404).render('public/error', { message: 'Dossier non trouvé' });
  }
  
  const personnes = await fetchAll(db, "SELECT * FROM personnes WHERE dossier_id = ?", [dossier.id]);
  const chronologie = await fetchAll(db, "SELECT * FROM chronologie WHERE dossier_id = ? ORDER BY ordre", [dossier.id]);
  const images = await fetchAll(db, "SELECT * FROM images WHERE dossier_id = ?", [dossier.id]);
  
  const lang = res.locals.lang;
  const intro = lang === 'en' && dossier.introduction_en ? dossier.introduction_en : dossier.introduction_fr;
  const content = lang === 'en' && dossier.contenu_en ? dossier.contenu_en : dossier.contenu_fr;
  
  const renderedIntro = renderMarkdown(intro);
  const renderedContent = renderMarkdown(content);
  const renderedSources = renderMarkdown(dossier.sources);
  
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
  
  const countRow = await fetchOne(db, "SELECT COUNT(*) as count FROM dossiers WHERE categorie = ? AND est_publie = 1", [cat]);
  const totalPages = Math.ceil((countRow ? countRow.count : 0) / limit);
  
  const dossiers = await fetchAll(db, `${dossierSelect} WHERE categorie = ? AND est_publie = 1 ORDER BY date_publication DESC LIMIT ? OFFSET ?`, [cat, limit, offset]);
  
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
