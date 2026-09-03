import glob

ejs_files = glob.glob('views/**/*.ejs', recursive=True)

google_tag = '  <meta name="google-site-verification" content="E8tvFUa2YQBYwu2Trgiu-jedEg74NwyrQ90tKcfiwyE" />\n'

for file in ejs_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'google-site-verification' not in content:
        content = content.replace('</head>', google_tag + '</head>')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)

print("Google verification tag injected into all EJS files!")
