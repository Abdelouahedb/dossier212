import re

with open('views/admin/dossier-form.ejs', 'r', encoding='utf-8') as f:
    code = f.read()

# For Personnes
person_fr = r'<div><div class="entry-label">DESCRIPTION \(FR\)</div><textarea data-i="\$\{i\}" data-f="description_fr" class="pe">\$\{p.description_fr\|\|\'\'\}</textarea></div>'
person_en = r'<div><div class="entry-label">DESCRIPTION (EN)</div><textarea data-i="${i}" data-f="description_en" class="pe">${p.description_en||""}</textarea></div>'
code = re.sub(person_fr, person_fr + '\n              ' + person_en, code)

# For Chronologie
timeline_fr = r'<div><div class="entry-label">DESCRIPTION \(FR\)</div><textarea data-i="\$\{i\}" data-f="description_fr" class="te">\$\{ev.description_fr\|\|\'\'\}</textarea></div>'
timeline_en = r'<div><div class="entry-label">DESCRIPTION (EN)</div><textarea data-i="${i}" data-f="description_en" class="te">${ev.description_en||""}</textarea></div>'
code = re.sub(timeline_fr, timeline_fr + '\n              ' + timeline_en, code)

# Init arrays
code = code.replace("description_fr:'' }", "description_fr:'', description_en:'' }")

with open('views/admin/dossier-form.ejs', 'w', encoding='utf-8') as f:
    f.write(code)

print("EJS fixed!")
