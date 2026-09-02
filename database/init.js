const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

async function getDb() {
  if (pool) return pool;
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Create tables if they don't exist
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS dossiers (
      id SERIAL PRIMARY KEY,
      numero INTEGER UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      titre_fr TEXT NOT NULL,
      titre_en TEXT,
      lieu TEXT,
      coordonnees TEXT,
      periode TEXT,
      categorie TEXT,
      tags TEXT,
      statut TEXT,
      temps_lecture INTEGER,
      est_publie INTEGER DEFAULT 0,
      est_a_la_une INTEGER DEFAULT 0,
      introduction_fr TEXT,
      introduction_en TEXT,
      contenu_fr TEXT,
      contenu_en TEXT,
      sources TEXT,
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      date_publication TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personnes (
      id SERIAL PRIMARY KEY,
      dossier_id INTEGER REFERENCES dossiers(id) ON DELETE CASCADE,
      nom TEXT NOT NULL,
      role TEXT,
      description_fr TEXT,
      description_en TEXT
    );

    CREATE TABLE IF NOT EXISTS chronologie (
      id SERIAL PRIMARY KEY,
      dossier_id INTEGER REFERENCES dossiers(id) ON DELETE CASCADE,
      date_evenement TEXT NOT NULL,
      description_fr TEXT,
      description_en TEXT,
      ordre INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      dossier_id INTEGER REFERENCES dossiers(id) ON DELETE CASCADE,
      chemin TEXT NOT NULL,
      legende TEXT,
      ordre INTEGER DEFAULT 0
    );
  `;
  
  await pool.query(createTablesSql);
  return pool;
}

function saveDb() {
  // Not needed in Postgres
}

module.exports = { getDb, saveDb };
