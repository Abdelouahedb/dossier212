import os

files = ['views/public/index.ejs', 'views/public/dossier.ejs']

replacements = {
    '\n">\n  <link': '\n  <link',
    'EnquǦtes': 'Enquêtes',
    'marquǸ': 'marqué',
    '? LA UNE': 'À LA UNE',
    'AFFAIRES NON R%SOLUES': 'AFFAIRES NON RÉSOLUES',
    'FIGURES CL%S': 'FIGURES CLÉS',
    '?" DOSSIER 212': '— DOSSIER 212',
    '? propos ?" DOSSIER 212': 'À propos — DOSSIER 212'
}

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for bad, good in replacements.items():
        content = content.replace(bad, good)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed stray characters and French accents!")
