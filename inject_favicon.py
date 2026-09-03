import os
import glob

ejs_files = glob.glob('views/**/*.ejs', recursive=True)

favicon_tag = '  <link rel="icon" type="image/png" href="/favicon.png">\n'

for file in ejs_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<link rel="icon"' not in content:
        content = content.replace('</head>', favicon_tag + '</head>')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)

print("Favicon injected into all EJS files!")
