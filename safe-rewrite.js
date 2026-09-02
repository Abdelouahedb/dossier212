const fs = require('fs');
let code = fs.readFileSync('routes/admin.js', 'utf8');

// Replace db.run with db.query wrapper logic
code = code.replace(/db\.run\(/g, `await (async (sql, params = []) => {
  let pgSql = sql;
  let i = 1;
  while (pgSql.includes('?')) { pgSql = pgSql.replace('?', '$' + i++); }
  return db.query(pgSql, params);
})(`);

// Fix last_insert_rowid logic for Postgres
code = code.replace(/const dossierIdResult = db\.exec\("SELECT last_insert_rowid\(\) as id"\);\s*const dossierId = dossierIdResult\[0\]\.values\[0\]\[0\];/g, 
  `const dossierIdResult = await db.query("SELECT currval('dossiers_id_seq') as id");\n  const dossierId = dossierIdResult.rows[0].id;`);
  
// Fix fetchAll / fetchOne calls to use await (ignoring the function definitions at the top)
code = code.replace(/const dossiers = fetchAll/g, 'const dossiers = await fetchAll');
code = code.replace(/const images = fetchAll/g, 'const images = await fetchAll');
code = code.replace(/const dossier = fetchOne/g, 'const dossier = await fetchOne');
code = code.replace(/const personnes = fetchAll/g, 'const personnes = await fetchAll');
code = code.replace(/const chronologie = fetchAll/g, 'const chronologie = await fetchAll');
code = code.replace(/const currentDossier = fetchOne/g, 'const currentDossier = await fetchOne');
code = code.replace(/const maxNumRow = fetchOne/g, 'const maxNumRow = await fetchOne');
code = code.replace(/const dossierResult = fetchOne/g, 'const dossierResult = await fetchOne');

// Fix upload route to use req.files[0].path from Cloudinary instead of filename
code = code.replace(/const filePath = '\/uploads\/' \+ file\.filename;/g, `const filePath = file.path;`);

// Remove saveDb calls as they are no longer needed for Postgres
code = code.replace(/saveDb\(\);/g, `// saveDb();`);

fs.writeFileSync('routes/admin.js', code);
console.log('Safe admin.js updated!');
