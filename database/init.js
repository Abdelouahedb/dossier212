const fs = require('fs');
const path = require('path');

let db = null;
const dbPath = path.join(__dirname, 'dossier212.db');

async function getDb() {
  if (db) return db;
  
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.run(schema);
    
    // Seed data
    const introFr = "En 1974, Jacques Leveugle, professeur respecté au Maroc, cachait une réalité beaucoup plus sombre. Une enquête internationale révèle aujourd'hui les profondeurs d'un réseau complexe. Ce dossier plonge au cœur des non-dits et des archives exhumées.\n\nSon influence dans la région de Khénifra lui a permis de tisser des liens avec les autorités locales, lui offrant une impunité pendant des décennies.";
    const introEn = "In 1974, Jacques Leveugle, a respected teacher in Morocco, hid a much darker reality. An international investigation now reveals the depths of a complex network. This dossier dives into the heart of the unsaid and exhumed archives.\n\nHis influence in the Khénifra region allowed him to forge ties with local authorities, offering him impunity for decades.";
    
    const contenuFr = "## Contexte\n\nLe Maroc des années 70 était un carrefour pour beaucoup d'expatriés. Jacques Leveugle s'installe à Khénifra en tant que coopérant. Son rôle d'éducateur lui confère une aura d'intouchable.\n\n## Les faits\n\nDes témoignages récents, appuyés par des photographies trouvées dans des archives oubliées, documentent des actes de pédocriminalité étalés sur plus de trente ans. Les victimes, souvent issues de milieux défavorisés, sont restées silencieuses par peur des représailles.\n\n## L'enquête\n\nEn 2026, la réouverture d'anciens dossiers par une commission indépendante a mis en lumière des incohérences dans les rapports de police de l'époque. Les enquêteurs tentent aujourd'hui de reconstituer le puzzle.\n\n## La justice\n\nMalgré les preuves accablantes, la justice peine à avancer. La prescription des faits et la disparition de plusieurs témoins clés rendent la tâche difficile.\n\n## Ce que l'on ignore encore\n\nL'étendue réelle de ses complices au sein de l'administration locale reste l'un des grands mystères de cette affaire.";
    
    const contenuEn = "## Context\n\nMorocco in the 1970s was a crossroads for many expatriates. Jacques Leveugle settled in Khénifra as a cooperative worker. His role as an educator gave him an aura of being untouchable.\n\n## The Facts\n\nRecent testimonies, supported by photographs found in forgotten archives, document acts of pedocriminality spread over more than thirty years. The victims, often from disadvantaged backgrounds, remained silent out of fear of reprisals.\n\n## The Investigation\n\nIn 2026, the reopening of old cases by an independent commission brought to light inconsistencies in police reports from the time. Investigators are now trying to piece the puzzle together.\n\n## Justice\n\nDespite overwhelming evidence, the justice system is struggling to move forward. The statute of limitations and the disappearance of several key witnesses make the task difficult.\n\n## What remains unknown\n\nThe true extent of his accomplices within the local administration remains one of the great mysteries of this case.";
  
    const sourcesFr = "- Archives Départementales de Khénifra\n- Témoignages anonymes\n- Rapport de la commission indépendante (2025)";
  
    db.run(`
      INSERT INTO dossiers (
        numero, slug, titre_fr, titre_en, lieu, coordonnees, periode, categorie, tags,
        statut, temps_lecture, est_publie, est_a_la_une, introduction_fr, introduction_en,
        contenu_fr, contenu_en, sources
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 'jacques-leveugle-maroc', 'Jacques Leveugle au Maroc', 'Jacques Leveugle in Morocco',
      'KHÉNIFRA, MAROC', '32.9394° N, 5.6675° W', '1974 — 2026', 'maroc', 'PÉDOCRIMINALITÉ · ENQUÊTE INTERNATIONALE',
      'enquete', 14, 1, 1, introFr, introEn, contenuFr, contenuEn, sourcesFr
    ]);
    
    // Get last insert ID (workaround for sql.js)
    const dossierId1Result = db.exec("SELECT last_insert_rowid() as id");
    const dossierId1 = dossierId1Result[0].values[0][0];

    db.run("INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [dossierId1, 'Jacques Leveugle', 'suspect', 'Professeur de mathématiques et suspect principal.']);
    db.run("INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [dossierId1, 'Témoin A', 'victime', 'Ancien élève ayant brisé le silence en 2025.']);
    db.run("INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [dossierId1, 'Inspecteur M.', 'enqueteur', 'En charge de la réouverture du dossier.']);

    db.run("INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [dossierId1, 'Septembre 1974', 'Arrivée de Jacques Leveugle au Maroc.', 1]);
    db.run("INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [dossierId1, 'Mars 1985', 'Premières rumeurs étouffées par la direction de l\'école.', 2]);
    db.run("INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [dossierId1, 'Novembre 2025', 'Découverte de photographies dans un entrepôt désaffecté.', 3]);
    db.run("INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [dossierId1, 'Janvier 2026', 'Ouverture officielle de l\'enquête internationale.', 4]);

    // DOSSIER 002
    db.run(`
      INSERT INTO dossiers (
        numero, slug, titre_fr, titre_en, lieu, coordonnees, periode, categorie, tags,
        statut, temps_lecture, est_publie, est_a_la_une, introduction_fr, introduction_en,
        contenu_fr, contenu_en, sources
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      2, 'disparition-mystere', 'La disparition mystère', 'The Mystery Disappearance',
      'PARIS, FRANCE', '48.8566° N, 2.3522° E', '2010 — 2024', 'monde', 'DISPARITION',
      'non-resolu', 8, 1, 0, 'Un deuxième dossier de test.', 'A second test dossier.',
      '## Test', '## Test', ''
    ]);

    saveDb();
    console.log("Database seeded successfully.");
  }
  
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

module.exports = { getDb, saveDb };
