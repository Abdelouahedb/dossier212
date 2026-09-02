CREATE TABLE IF NOT EXISTS dossiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  titre_fr TEXT NOT NULL,
  titre_en TEXT DEFAULT '',
  lieu TEXT DEFAULT '',
  coordonnees TEXT DEFAULT '',
  periode TEXT DEFAULT '',
  categorie TEXT DEFAULT 'maroc',
  tags TEXT DEFAULT '',
  statut TEXT DEFAULT 'enquete',
  temps_lecture INTEGER DEFAULT 10,
  image_principale TEXT DEFAULT '',
  introduction_fr TEXT DEFAULT '',
  introduction_en TEXT DEFAULT '',
  contenu_fr TEXT DEFAULT '',
  contenu_en TEXT DEFAULT '',
  sources TEXT DEFAULT '',
  est_publie INTEGER DEFAULT 0,
  est_a_la_une INTEGER DEFAULT 0,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_publication DATETIME
);

CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dossier_id INTEGER,
  chemin TEXT NOT NULL,
  cloudinary_public_id TEXT DEFAULT '',
  legende_fr TEXT DEFAULT '',
  legende_en TEXT DEFAULT '',
  credit TEXT DEFAULT '',
  date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS personnes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dossier_id INTEGER NOT NULL,
  nom TEXT NOT NULL,
  role TEXT DEFAULT 'temoin',
  description_fr TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  statut_judiciaire TEXT DEFAULT '',
  FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chronologie (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dossier_id INTEGER NOT NULL,
  date_evenement TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_en TEXT DEFAULT '',
  ordre INTEGER DEFAULT 0,
  FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE
);
