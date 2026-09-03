import os

# 1. Add GSAP to footer.ejs
footer_path = 'views/partials/footer.ejs'
with open(footer_path, 'r', encoding='utf-8') as f:
    footer = f.read()

gsap_script = '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>\n'
if 'gsap.min.js' not in footer:
    footer = footer.replace('<script src="/js/main.js"></script>', gsap_script + '  <script src="/js/main.js"></script>')
    with open(footer_path, 'w', encoding='utf-8') as f:
        f.write(footer)

# 2. Add class .scramble-text to dossier.ejs
dossier_path = 'views/public/dossier.ejs'
with open(dossier_path, 'r', encoding='utf-8') as f:
    dossier = f.read()

# Add to numero and title
dossier = dossier.replace('class="dossier-numero"', 'class="dossier-numero scramble-text"')
dossier = dossier.replace('class="dossier-titre"', 'class="dossier-titre scramble-text"')
dossier = dossier.replace('class="dossier-periode"', 'class="dossier-periode scramble-text"')

with open(dossier_path, 'w', encoding='utf-8') as f:
    f.write(dossier)

# 3. Add JS logic to main.js
js_path = 'public/js/main.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

scramble_code = """
/**
 * Declassified Scramble Effect
 */
function initDeclassifiedScramble() {
  const elements = document.querySelectorAll('.scramble-text');
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!<>{}[]";
  
  elements.forEach(el => {
    const originalText = el.innerText;
    // Keep exact dimensions so the layout doesn't jump
    el.style.minWidth = el.offsetWidth + 'px';
    
    let iterations = 0;
    
    const interval = setInterval(() => {
      el.innerText = originalText.split("").map((letter, index) => {
        // Don't scramble spaces
        if (letter === ' ') return ' ';
        
        if (index < iterations) {
          return originalText[index];
        }
        return characters[Math.floor(Math.random() * characters.length)];
      }).join("");
      
      if (iterations >= originalText.length) {
        clearInterval(interval);
        el.style.minWidth = 'auto'; // release width constraint
      }
      
      // Control speed: smaller increment = longer scramble
      iterations += 1/2; 
    }, 30);
  });
}
"""

if 'initDeclassifiedScramble' not in js_content:
    # Inject it before the DOMContentLoaded listener ends
    js_content = js_content.replace('initScrollAnimations();', 'initScrollAnimations();\n  initDeclassifiedScramble();')
    js_content += "\n" + scramble_code
    
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

print("Scramble effect injected successfully!")
