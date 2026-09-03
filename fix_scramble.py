import re

js_path = 'public/js/main.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

new_scramble = """function initDeclassifiedScramble() {
  const elements = document.querySelectorAll('.scramble-text');
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
  
  elements.forEach(el => {
    const originalText = el.innerText.trim();
    
    // Make parent relative to hold the absolute overlay
    el.style.position = 'relative';
    
    // Create an invisible clone of the text to force the exact perfect height/width (prevents mobile jumping)
    const hiddenSpan = document.createElement('span');
    hiddenSpan.style.opacity = '0';
    hiddenSpan.innerText = originalText;
    
    // Create the scrambling overlay
    const overlaySpan = document.createElement('span');
    overlaySpan.style.position = 'absolute';
    overlaySpan.style.top = '0';
    overlaySpan.style.left = '0';
    overlaySpan.style.width = '100%';
    overlaySpan.style.height = '100%';
    overlaySpan.style.display = 'inline-block';
    
    el.innerHTML = '';
    el.appendChild(hiddenSpan);
    el.appendChild(overlaySpan);
    
    let iterations = 0;
    
    const interval = setInterval(() => {
      overlaySpan.innerText = originalText.split("").map((letter, index) => {
        if (letter === ' ') return ' ';
        if (index < iterations) {
          return originalText[index];
        }
        return characters[Math.floor(Math.random() * characters.length)];
      }).join("");
      
      if (iterations >= originalText.length) {
        clearInterval(interval);
        el.innerHTML = originalText; // Restore original HTML cleanly
      }
      
      // Speed control: higher is much faster
      iterations += 1.5; 
    }, 20); // 20ms = blazing fast framerate
  });
}"""

# Replace the old function
js_content = re.sub(r'function initDeclassifiedScramble\(\) \{.*?(?=\n\n|\Z)', new_scramble, js_content, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Scramble speed and layout fixed!")
