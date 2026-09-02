const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../database/init');
const { requireAuth, attemptLogin } = require('../middleware/auth');
const slugify = require('slugify');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper to fetch multiple rows
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

// Helper to fetch single row
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

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Auth Routes
router.get('/login', (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (attemptLogin(username, password)) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('admin/login', { error: 'Identifiants invalides' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Protect all following routes
router.use(requireAuth);

router.get('/', async (req, res) => {
  const db = await getDb();
  const dossiers = fetchAll(db, "SELECT * FROM dossiers ORDER BY date_creation DESC");
  const total = dossiers.length;
  const published = dossiers.filter(d => d.est_publie === 1).length;
  const drafts = total - published;
  
  res.render('admin/dashboard', { dossiers, stats: { total, published, drafts } });
});

router.get('/images', async (req, res) => {
  const db = await getDb();
  const images = fetchAll(db, "SELECT images.*, dossiers.titre_fr, dossiers.numero FROM images LEFT JOIN dossiers ON images.dossier_id = dossiers.id ORDER BY images.date_upload DESC");
  res.render('admin/images', { images });
});

router.get('/dossier/new', (req, res) => {
  res.render('admin/dossier-form', { dossier: null, personnes: [], chronologie: [], images: [] });
});

router.post('/dossier/new', async (req, res) => {
  const db = await getDb();
  const data = req.body;
  const slug = slugify(data.titre_fr, { lower: true, strict: true });
  
  const maxNumRow = fetchOne(db, "SELECT MAX(numero) as maxNum FROM dossiers");
  const nextNum = (maxNumRow && maxNumRow.maxNum ? maxNumRow.maxNum : 0) + 1;

  try {
    const estPublie = data.est_publie ? 1 : 0;
    const estALaUne = data.est_a_la_une ? 1 : 0;

    // If setting to A la Une, remove it from all others first
    if (estALaUne === 1) {
      db.run("UPDATE dossiers SET est_a_la_une = 0");
    }

    db.run(`
      INSERT INTO dossiers (
        numero, slug, titre_fr, titre_en, lieu, coordonnees, periode, categorie, tags,
        statut, temps_lecture, est_publie, est_a_la_une, introduction_fr, introduction_en, contenu_fr, contenu_en, sources
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nextNum, slug, data.titre_fr, data.titre_en, data.lieu, data.coordonnees,
      data.periode, data.categorie, data.tags, data.statut, data.temps_lecture,
      estPublie, estALaUne, data.introduction_fr, data.introduction_en, data.contenu_fr, data.contenu_en, data.sources
    ]);
    
    // Get last insert ID
    const dossierIdResult = db.exec("SELECT last_insert_rowid() as id");
    const dossierId = dossierIdResult[0].values[0][0];
    
    // Handle personnes
    const personnesRaw = data.personnes || data.personnes_json;
    if (personnesRaw) {
      let personnesArr = [];
      try { personnesArr = typeof personnesRaw === 'string' ? JSON.parse(personnesRaw) : personnesRaw; } catch (e) {}
      for (const p of personnesArr) {
        db.run("INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [dossierId, p.nom, p.role, p.description_fr]);
      }
    }

    // Handle chronologie
    const chronologieRaw = data.chronologie || data.chronologie_json;
    if (chronologieRaw) {
      let chronoArr = [];
      try { chronoArr = typeof chronologieRaw === 'string' ? JSON.parse(chronologieRaw) : chronologieRaw; } catch (e) {}
      for (const c of chronoArr) {
        db.run("INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [dossierId, c.date_evenement, c.description_fr, c.ordre || 0]);
      }
    }

    saveDb();
    res.redirect(`/admin/dossier/${dossierId}/edit`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la création du dossier.");
  }
});

router.get('/dossier/:id/edit', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const dossier = fetchOne(db, "SELECT * FROM dossiers WHERE id = ?", [id]);
  if (!dossier) return res.status(404).send("Non trouvé");
  
  const personnes = fetchAll(db, "SELECT * FROM personnes WHERE dossier_id = ?", [id]);
  const chronologie = fetchAll(db, "SELECT * FROM chronologie WHERE dossier_id = ? ORDER BY ordre", [id]);
  const images = fetchAll(db, "SELECT * FROM images WHERE dossier_id = ?", [id]);
  
  res.render('admin/dossier-form', { dossier, personnes, chronologie, images, success: req.query.success ? 'Dossier mis à jour avec succès.' : null });
});

router.post('/dossier/:id/edit', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const data = req.body;
  
  const currentDossier = fetchOne(db, "SELECT slug, est_publie FROM dossiers WHERE id = ?", [id]);
  if (!currentDossier) return res.status(404).send("Non trouvé");

  try {
    const estPublie = data.est_publie ? 1 : 0;
    const estALaUne = data.est_a_la_une ? 1 : 0;

    // If setting to A la Une, remove it from all others first
    if (estALaUne === 1) {
      db.run("UPDATE dossiers SET est_a_la_une = 0");
    }

    // Check if we are publishing right now to set the date
    let datePubSQL = "";
    if (estPublie && !currentDossier.est_publie) {
      datePubSQL = ", date_publication = CURRENT_TIMESTAMP";
    }

    db.run(`
      UPDATE dossiers SET 
        titre_fr = ?, titre_en = ?, lieu = ?, coordonnees = ?, periode = ?,
        categorie = ?, tags = ?, statut = ?, temps_lecture = ?,
        est_publie = ?, est_a_la_une = ?,
        introduction_fr = ?, introduction_en = ?, contenu_fr = ?, contenu_en = ?,
        sources = ?, date_modification = CURRENT_TIMESTAMP${datePubSQL}
      WHERE id = ?
    `, [
      data.titre_fr, data.titre_en, data.lieu, data.coordonnees, data.periode,
      data.categorie, data.tags, data.statut, data.temps_lecture,
      estPublie, estALaUne,
      data.introduction_fr, data.introduction_en, data.contenu_fr, data.contenu_en,
      data.sources, id
    ]);

    // Update personnes
    db.run("DELETE FROM personnes WHERE dossier_id = ?", [id]);
    const personnesRaw = data.personnes || data.personnes_json;
    if (personnesRaw) {
      let personnesArr = [];
      try { personnesArr = typeof personnesRaw === 'string' ? JSON.parse(personnesRaw) : personnesRaw; } catch (e) {}
      for (const p of personnesArr) {
        db.run("INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [id, p.nom, p.role, p.description_fr]);
      }
    }

    // Update chronologie
    db.run("DELETE FROM chronologie WHERE dossier_id = ?", [id]);
    const chronologieRaw = data.chronologie || data.chronologie_json;
    if (chronologieRaw) {
      let chronoArr = [];
      try { chronoArr = typeof chronologieRaw === 'string' ? JSON.parse(chronologieRaw) : chronologieRaw; } catch (e) {}
      for (const c of chronoArr) {
        db.run("INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [id, c.date_evenement, c.description_fr, c.ordre || 0]);
      }
    }

    saveDb();
    res.redirect(`/admin/dossier/${id}/edit?success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la mise à jour");
  }
});

router.post('/dossier/:id/delete', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const images = fetchAll(db, "SELECT chemin FROM images WHERE dossier_id = ?", [id]);
  
  // Delete files
  images.forEach(img => {
    const filePath = path.join(__dirname, '../public', img.chemin);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
  
  db.run("DELETE FROM dossiers WHERE id = ?", [id]);
  saveDb();
  res.redirect('/admin');
});

router.post('/dossier/:id/upload', upload.array('images'), async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  if (req.files) {
    req.files.forEach(file => {
      db.run("INSERT INTO images (dossier_id, chemin) VALUES (?, ?)", [id, '/uploads/' + file.filename]);
    });
    saveDb();
  }
  res.redirect(`/admin/dossier/${id}/edit`);
});

router.post('/image/:id/delete', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const image = fetchOne(db, "SELECT * FROM images WHERE id = ?", [id]);
  
  if (image) {
    const filePath = path.join(__dirname, '../public', image.chemin);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.run("DELETE FROM images WHERE id = ?", [id]);
    saveDb();
  }
  
  res.redirect('back');
});

router.post('/dossier/:id/toggle-featured', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  db.run("UPDATE dossiers SET est_a_la_une = 0");
  db.run("UPDATE dossiers SET est_a_la_une = 1 WHERE id = ?", [id]);
  saveDb();
  res.redirect('back');
});

router.post('/dossier/:id/toggle-publish', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const dossier = fetchOne(db, "SELECT est_publie, date_publication FROM dossiers WHERE id = ?", [id]);
  if (!dossier) return res.redirect('back');

  const newStatus = dossier.est_publie === 1 ? 0 : 1;
  let updateQuery = "UPDATE dossiers SET est_publie = ?";
  const params = [newStatus];

  if (newStatus === 1 && !dossier.date_publication) {
    updateQuery += ", date_publication = CURRENT_TIMESTAMP";
  }

  updateQuery += " WHERE id = ?";
  params.push(id);

  db.run(updateQuery, params);
  saveDb();
  res.redirect('back');
});

module.exports = router;
