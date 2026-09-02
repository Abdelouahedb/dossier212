import re

with open('routes/admin.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Top fetch helpers
code = re.sub(
    r'function fetchAll[\s\S]*?return rows;\n}',
    """async function fetchAll(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
  const result = await db.query(pgSql, params);
  return result.rows;
}""", code
)

code = re.sub(
    r'function fetchOne[\s\S]*?return row;\n}',
    """async function fetchOne(db, sql, params = []) {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
  const result = await db.query(pgSql, params);
  return result.rows[0] || null;
}""", code
)

# 2. Multer
multer_code = """const cloudinary = require('cloudinary').v2;
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

const upload = multer({ storage: storage });"""

code = re.sub(r'// Multer setup[\s\S]*?\}\n\}\);\n', multer_code + '\n', code)

# 3. db.run wrappers
def db_run_replacer(match):
    return """await (async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i); i++; }
      return db.query(pgSql, params);
    })("""

code = re.sub(r'db\.run\(', db_run_replacer, code)

# 4. last_insert_rowid
code = re.sub(
    r'const dossierIdResult = db\.exec\("SELECT last_insert_rowid\(\) as id"\);\s*const dossierId = dossierIdResult\[0\]\.values\[0\]\[0\];',
    """const dossierIdResult = await db.query("SELECT currval('dossiers_id_seq') as id");
    const dossierId = dossierIdResult.rows[0].id;""",
    code
)

# 5. Awaits
code = code.replace('const dossiers = fetchAll', 'const dossiers = await fetchAll')
code = code.replace('const images = fetchAll', 'const images = await fetchAll')
code = code.replace('const dossier = fetchOne', 'const dossier = await fetchOne')
code = code.replace('const personnes = fetchAll', 'const personnes = await fetchAll')
code = code.replace('const chronologie = fetchAll', 'const chronologie = await fetchAll')
code = code.replace('const currentDossier = fetchOne', 'const currentDossier = await fetchOne')
code = code.replace('const maxNumRow = fetchOne', 'const maxNumRow = await fetchOne')
code = code.replace('const dossierResult = fetchOne', 'const dossierResult = await fetchOne')

# 6. file path
code = code.replace("const filePath = '/uploads/' + file.filename;", "const filePath = file.path;")

# 7. saveDb
code = code.replace("saveDb();", "// saveDb();")

with open('routes/admin.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Python rewrite complete!")
