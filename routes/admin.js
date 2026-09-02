const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../database/init');
const { requireAuth, attemptLogin } = require('../middleware/auth');
const slugify = require('slugify');
const multer = require('multer');

// Helper to fetch multiple rows
async function fetchAll(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
  const result = await db.query(pgSql, params);
  return result.rows;
}

// Helper to fetch single row
async function fetchOne(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
  const result = await db.query(pgSql, params);
  return result.rows[0] || null;
}

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dossier212',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});

const upload = multer({ storage: storage });

async function query(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
  return db.query(pgSql, params);
}

async function deleteCloudinaryImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    // Do not leave database records behind when a remote cleanup fails.
    console.error(`Unable to delete Cloudinary image ${publicId}:`, error.message);
  }
}

// Filter handled by cloudinary config natively, or we can just ignore it here since allowed_formats is set

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
  req.session = null;
  res.redirect('/');
});

// Protect all following routes
router.use(requireAuth);

router.get('/', async (req, res) => {
  const db = await getDb();
  const dossiers = await fetchAll(db, "SELECT * FROM dossiers ORDER BY date_creation DESC");
  const total = dossiers.length;
  const published = dossiers.filter(d => d.est_publie === 1).length;
  const drafts = total - published;
  
  res.render('admin/dashboard', { dossiers, stats: { total, published, drafts } });
});

router.get('/images', async (req, res) => {
  const db = await getDb();
  const images = await fetchAll(db, "SELECT images.*, dossiers.titre_fr, dossiers.numero FROM images LEFT JOIN dossiers ON images.dossier_id = dossiers.id ORDER BY images.date_upload DESC");
  res.render('admin/images', { images });
});

router.post('/images/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('Aucune image fournie.');

  try {
    const db = await getDb();
    await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', () => '$' + i); i++; }
      return db.query(pgSql, params);
    })('INSERT INTO images (chemin, cloudinary_public_id) VALUES (?, ?)', [req.file.path, req.file.filename]);
    res.redirect('/admin/images');
  } catch (error) {
    console.error('Unable to save uploaded image:', error);
    res.status(500).send("Erreur lors de l'enregistrement de l'image.");
  }
});

router.get('/dossier/new', (req, res) => {
  res.render('admin/dossier-form', { dossier: null, personnes: [], chronologie: [], images: [] });
});

router.post('/dossier/new', async (req, res) => {
  const db = await getDb();
  const data = req.body;
  const slug = slugify(data.titre_fr, { lower: true, strict: true });
  
  const maxNumRow = await fetchOne(db, "SELECT MAX(numero) as maxNum FROM dossiers");
  const nextNum = (maxNumRow && maxNumRow.maxNum ? maxNumRow.maxNum : 0) + 1;

  try {
    const estPublie = data.est_publie ? 1 : 0;
    const estALaUne = data.est_a_la_une ? 1 : 0;

    // If setting to A la Une, remove it from all others first
    if (estALaUne === 1) {
      await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("UPDATE dossiers SET est_a_la_une = 0");
    }

    await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })(`
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
    const dossierIdResult = await db.query("SELECT currval('dossiers_id_seq') as id");
    const dossierId = dossierIdResult.rows[0].id;
    
    // Handle personnes
    const personnesRaw = data.personnes || data.personnes_json;
    if (personnesRaw) {
      let personnesArr = [];
      try { personnesArr = typeof personnesRaw === 'string' ? JSON.parse(personnesRaw) : personnesRaw; } catch (e) {}
      for (const p of personnesArr) {
        await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [dossierId, p.nom, p.role, p.description_fr]);
      }
    }

    // Handle chronologie
    const chronologieRaw = data.chronologie || data.chronologie_json;
    if (chronologieRaw) {
      let chronoArr = [];
      try { chronoArr = typeof chronologieRaw === 'string' ? JSON.parse(chronologieRaw) : chronologieRaw; } catch (e) {}
      for (const c of chronoArr) {
        await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [dossierId, c.date_evenement, c.description_fr, c.ordre || 0]);
      }
    }

    // saveDb();
    res.redirect(`/admin/dossier/${dossierId}/edit`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la création du dossier.");
  }
});

router.get('/dossier/:id/edit', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const dossier = await fetchOne(db, "SELECT * FROM dossiers WHERE id = ?", [id]);
  if (!dossier) return res.status(404).send("Non trouvé");
  
  const personnes = await fetchAll(db, "SELECT * FROM personnes WHERE dossier_id = ?", [id]);
  const chronologie = await fetchAll(db, "SELECT * FROM chronologie WHERE dossier_id = ? ORDER BY ordre", [id]);
  const images = await fetchAll(db, "SELECT * FROM images WHERE dossier_id = ?", [id]);
  
  res.render('admin/dossier-form', { dossier, personnes, chronologie, images, success: req.query.success ? 'Dossier mis à jour avec succès.' : null });
});

router.post('/dossier/:id/edit', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const data = req.body;
  
  const currentDossier = await fetchOne(db, "SELECT slug, est_publie FROM dossiers WHERE id = ?", [id]);
  if (!currentDossier) return res.status(404).send("Non trouvé");

  try {
    const estPublie = data.est_publie ? 1 : 0;
    const estALaUne = data.est_a_la_une ? 1 : 0;

    // If setting to A la Une, remove it from all others first
    if (estALaUne === 1) {
      await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("UPDATE dossiers SET est_a_la_une = 0");
    }

    // Check if we are publishing right now to set the date
    let datePubSQL = "";
    if (estPublie && !currentDossier.est_publie) {
      datePubSQL = ", date_publication = CURRENT_TIMESTAMP";
    }

    await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })(`
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
    await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("DELETE FROM personnes WHERE dossier_id = ?", [id]);
    const personnesRaw = data.personnes || data.personnes_json;
    if (personnesRaw) {
      let personnesArr = [];
      try { personnesArr = typeof personnesRaw === 'string' ? JSON.parse(personnesRaw) : personnesRaw; } catch (e) {}
      for (const p of personnesArr) {
        await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [id, p.nom, p.role, p.description_fr]);
      }
    }

    // Update chronologie
    await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("DELETE FROM chronologie WHERE dossier_id = ?", [id]);
    const chronologieRaw = data.chronologie || data.chronologie_json;
    if (chronologieRaw) {
      let chronoArr = [];
      try { chronoArr = typeof chronologieRaw === 'string' ? JSON.parse(chronologieRaw) : chronologieRaw; } catch (e) {}
      for (const c of chronoArr) {
        await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [id, c.date_evenement, c.description_fr, c.ordre || 0]);
      }
    }

    // saveDb();
    res.redirect(`/admin/dossier/${id}/edit?success=1`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la mise à jour");
  }
});

router.post('/dossier/:id/delete', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const images = await fetchAll(db, "SELECT cloudinary_public_id FROM images WHERE dossier_id = ?", [id]);
  
  await Promise.all(images.map((image) => deleteCloudinaryImage(image.cloudinary_public_id)));
  
  await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("DELETE FROM dossiers WHERE id = ?", [id]);
  // saveDb();
  res.redirect('/admin');
});

router.post('/dossier/:id/upload', upload.array('images'), async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  if (req.files && req.files.length > 0) {
    await Promise.all(req.files.map((file) =>
      (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', () => '$' + i); i++; }
      return db.query(pgSql, params);
    })('INSERT INTO images (dossier_id, chemin, cloudinary_public_id) VALUES (?, ?, ?)', [id, file.path, file.filename])
    ));
  }
  res.redirect(`/admin/dossier/${id}/edit`);
});

router.post('/image/:id/delete', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const image = await fetchOne(db, "SELECT * FROM images WHERE id = ?", [id]);
  
  if (image) {
    await deleteCloudinaryImage(image.cloudinary_public_id);
    await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("DELETE FROM images WHERE id = ?", [id]);
    // saveDb();
  }
  
  res.redirect('back');
});

router.post('/dossier/:id/toggle-featured', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("UPDATE dossiers SET est_a_la_une = 0");
  await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("UPDATE dossiers SET est_a_la_une = 1 WHERE id = ?", [id]);
  // saveDb();
  res.redirect('back');
});

router.post('/dossier/:id/toggle-publish', async (req, res) => {
  const db = await getDb();
  const id = req.params.id;
  const dossier = await fetchOne(db, "SELECT est_publie, date_publication FROM dossiers WHERE id = ?", [id]);
  if (!dossier) return res.redirect('back');

  const newStatus = dossier.est_publie === 1 ? 0 : 1;
  let updateQuery = "UPDATE dossiers SET est_publie = ?";
  const params = [newStatus];

  if (newStatus === 1 && !dossier.date_publication) {
    updateQuery += ", date_publication = CURRENT_TIMESTAMP";
  }

  updateQuery += " WHERE id = ?";
  params.push(id);

  await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })(updateQuery, params);
  // saveDb();
  res.redirect('back');
});

module.exports = router;
