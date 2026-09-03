with open('views/admin/dossier-form.ejs', 'r', encoding='utf-8') as f:
    code = f.read()

# The bad replacement injected literal backslashes like \$\{p.description_fr\|\|\'\'\}
code = code.replace(r"\$\{i\}", "${i}")
code = code.replace(r"\$\{p.description_fr\|\|\'\'\}", "${p.description_fr||''}")
code = code.replace(r"\$\{ev.description_fr\|\|\'\'\}", "${ev.description_fr||''}")

with open('views/admin/dossier-form.ejs', 'w', encoding='utf-8') as f:
    f.write(code)

print("EJS backslashes fixed!")
