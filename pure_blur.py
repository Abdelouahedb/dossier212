import re

# 1. Update main.js
js_path = 'public/js/main.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

new_effect = """function initDeclassifiedScramble() {
  const elements = document.querySelectorAll('.scramble-text');
  
  // Use pure CSS transitions instead of external GSAP library to guarantee it runs everywhere
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('revealed');
    }, 100 + (index * 150)); // Stagger the animation
  });
}"""

js_content = re.sub(r'function initDeclassifiedScramble\(\) \{.*?(?=\n\n|\Z)', new_effect, js_content, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

# 2. Add CSS rules
css_path = 'public/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

if '.scramble-text.revealed' not in css_content:
    css_rules = """
/* Cinematic Blur Reveal */
.scramble-text {
  opacity: 0;
  filter: blur(15px);
  transform: translateY(15px);
  transition: opacity 1.2s cubic-bezier(0.25, 1, 0.5, 1), 
              filter 1.2s cubic-bezier(0.25, 1, 0.5, 1), 
              transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: opacity, filter, transform;
}
.scramble-text.revealed {
  opacity: 1;
  filter: blur(0px);
  transform: translateY(0);
}
"""
    css_content += css_rules
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css_content)

print("Swapped to Pure CSS/JS Blur Reveal!")
