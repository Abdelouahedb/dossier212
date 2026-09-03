import re

js_path = 'public/js/main.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

new_effect = """function initDeclassifiedScramble() {
  const elements = document.querySelectorAll('.scramble-text');
  
  // Replace the chaotic scramble with a buttery-smooth, cinematic GSAP blur reveal
  elements.forEach((el, index) => {
    gsap.fromTo(el, 
      { 
        opacity: 0, 
        filter: "blur(15px)", 
        y: 15 
      },
      { 
        opacity: 1, 
        filter: "blur(0px)", 
        y: 0, 
        duration: 1.2, 
        ease: "power2.out",
        delay: 0.1 + (index * 0.15) // Stagger them slightly if there are multiple
      }
    );
  });
}"""

# Replace the old function
js_content = re.sub(r'function initDeclassifiedScramble\(\) \{.*?(?=\n\n|\Z)', new_effect, js_content, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Swapped to Cinematic Blur Reveal!")
