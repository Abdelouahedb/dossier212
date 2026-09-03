from PIL import Image
import os

input_path = r"C:\Users\Dex\.gemini\antigravity\brain\c1e623c6-267a-42ec-ba4c-89c4b63df51c\.user_uploaded\media_1788443973811.png"
output_path = r"C:\Users\Dex\.gemini\antigravity\scratch\dossier-212\public\favicon.png"
output_ico = r"C:\Users\Dex\.gemini\antigravity\scratch\dossier-212\public\favicon.ico"

img = Image.open(input_path).convert('RGB')
width, height = img.size

# The logo is centered. "DOSSIER 212". 
# The "212" is on the right side. Let's find all "reddish" pixels to get the bounding box of "212".
min_x, min_y, max_x, max_y = width, height, 0, 0

pixels = img.load()
for y in range(height):
    for x in range(width):
        r, g, b = pixels[x, y]
        # Red text: R is high, G and B are low.
        if r > 100 and g < 60 and b < 60:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

if max_x >= min_x and max_y >= min_y:
    # We found the red 212!
    # Let's make a square bounding box around it.
    w = max_x - min_x
    h = max_y - min_y
    
    size = max(w, h)
    # add some padding
    padding = int(size * 0.2)
    size += padding * 2
    
    center_x = min_x + w // 2
    center_y = min_y + h // 2
    
    crop_x1 = center_x - size // 2
    crop_y1 = center_y - size // 2
    crop_x2 = crop_x1 + size
    crop_y2 = crop_y1 + size
    
    cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    
    # Save as PNG
    cropped.save(output_path)
    
    # Save as ICO (requires resizing)
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    cropped.save(output_ico, format='ICO', sizes=icon_sizes)
    print("Favicon generated successfully from the red '212'!")
else:
    print("Could not find the red text.")
