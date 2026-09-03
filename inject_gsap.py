import glob

ejs_files = glob.glob('views/public/*.ejs', recursive=True)
gsap_script = '  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>\n  <script src="/js/main.js"></script>'

for file in ejs_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'gsap.min.js' not in content and '<script src="/js/main.js"></script>' in content:
        content = content.replace('<script src="/js/main.js"></script>', gsap_script)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)

print("GSAP injected into public EJS files!")
