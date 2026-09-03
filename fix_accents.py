import codecs

file_path = 'views/public/a-propos.ejs'

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix corrupted characters
replacements = {
    "vǸritable": "véritable",
    "passionnǸ": "passionné",
    "mystres": "mystères",
    "enquǦtes": "enquêtes",
    "qu'": "qu'à",
    "dǸdiǸ": "dédié",
    "dǸcouvre": "découvre",
    "Ǹtudie": "étudie",
    " mes": "à mes",
    "dǸcidǸ": "décidé",
    "Ǹtait": "était",
    " tous": "à tous",
    "rǸsolus": "résolus",
    "reconstituǸes": "reconstituées",
    "passionnǸs": "passionnés",
    "enquǦtions": "enquêtions",
    "spǸcifique": "spécifique",
    "requǦtes": "requêtes",
    "confidentialitǸ": "confidentialité",
    "identitǸ": "identité",
    "prioritǸ": "priorité",
    "privǸ": "privé",
    "? PROPOS": "À PROPOS",
    "? propos ?": "À propos -",
    "tǸmoignages": "témoignages",
    "Derrire": "Derrière"
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

# Write file back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Accents fixed in a-propos.ejs!")
