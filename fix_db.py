import re

with open('routes/admin.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [dossierId, p.nom, p.role, p.description_fr]',
    'INSERT INTO personnes (dossier_id, nom, role, description_fr, description_en) VALUES (?, ?, ?, ?, ?)", [dossierId, p.nom, p.role, p.description_fr, p.description_en]'
)

code = code.replace(
    'INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [dossierId, c.date_evenement, c.description_fr, c.ordre || 0]',
    'INSERT INTO chronologie (dossier_id, date_evenement, description_fr, description_en, ordre) VALUES (?, ?, ?, ?, ?)", [dossierId, c.date_evenement, c.description_fr, c.description_en, c.ordre || 0]'
)

code = code.replace(
    'INSERT INTO personnes (dossier_id, nom, role, description_fr) VALUES (?, ?, ?, ?)", [id, p.nom, p.role, p.description_fr]',
    'INSERT INTO personnes (dossier_id, nom, role, description_fr, description_en) VALUES (?, ?, ?, ?, ?)", [id, p.nom, p.role, p.description_fr, p.description_en]'
)

code = code.replace(
    'INSERT INTO chronologie (dossier_id, date_evenement, description_fr, ordre) VALUES (?, ?, ?, ?)", [id, c.date_evenement, c.description_fr, c.ordre || 0]',
    'INSERT INTO chronologie (dossier_id, date_evenement, description_fr, description_en, ordre) VALUES (?, ?, ?, ?, ?)", [id, c.date_evenement, c.description_fr, c.description_en, c.ordre || 0]'
)

with open('routes/admin.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Admin.js DB inserts fixed!")
