import re

with open('routes/admin.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace query(db, ...) with the inline wrapper that the rest of the file uses
wrapper = """(async (sql, params = []) => {
      let pgSql = sql;
      let i = 1;
      while (pgSql.includes('?')) { pgSql = pgSql.replace('?', () => '$' + i); i++; }
      return db.query(pgSql, params);
    })"""

code = code.replace("query(db, 'INSERT", wrapper + "('INSERT")

with open('routes/admin.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Images upload fixed!")
