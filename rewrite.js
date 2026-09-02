const fs = require('fs');
let code = fs.readFileSync('routes/admin.js', 'utf8');

code = code.replace(/function fetchAll[\s\S]*?return rows;\n}/, `async function fetchAll(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i++); }
  const result = await db.query(pgSql, params);
  return result.rows;
}`);

code = code.replace(/function fetchOne[\s\S]*?return row;\n}/, `async function fetchOne(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i++); }
  const result = await db.query(pgSql, params);
  return result.rows[0] || null;
}`);

code = code.replace(/db\.run\(/g, `await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i++); }
      return db.query(pgSql, params);
    })(`);

const multerReplacement = `const cloudinary = require('cloudinary').v2;
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

const upload = multer({ storage: storage });`;

code = code.replace(/\/\/ Multer setup[\s\S]*?\}\n\}\);\n/g, multerReplacement + '\n');

code = code.replace(/const dossierIdResult = db\.exec\("SELECT last_insert_rowid\(\) as id"\);\s*const dossierId = dossierIdResult\[0\]\.values\[0\]\[0\];/g, 
  `const dossierIdResult = await db.query("SELECT currval('dossiers_id_seq') as id");\n  const dossierId = dossierIdResult.rows[0].id;`);
  
code = code.replace(/const dossiers = fetchAll/g, 'const dossiers = await fetchAll');
code = code.replace(/const images = fetchAll/g, 'const images = await fetchAll');
code = code.replace(/const dossier = fetchOne/g, 'const dossier = await fetchOne');
code = code.replace(/const personnes = fetchAll/g, 'const personnes = await fetchAll');
code = code.replace(/const chronologie = fetchAll/g, 'const chronologie = await fetchAll');
code = code.replace(/const currentDossier = fetchOne/g, 'const currentDossier = await fetchOne');
code = code.replace(/const maxNumRow = fetchOne/g, 'const maxNumRow = await fetchOne');
code = code.replace(/const dossierResult = fetchOne/g, 'const dossierResult = await fetchOne');

code = code.replace(/const filePath = '\/uploads\/' \+ file\.filename;/g, `const filePath = file.path;`);

fs.writeFileSync('routes/admin.js', code);
console.log('admin.js updated!');
