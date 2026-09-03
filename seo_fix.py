import os
import re

# 1. ADD SITEMAP AND ROBOTS.TXT TO routes/public.js
public_js_path = 'routes/public.js'
with open(public_js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

sitemap_code = """
// SEO: robots.txt
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\\nAllow: /\\n\\nSitemap: https://www.dossier212.page/sitemap.xml`);
});

// SEO: Dynamic Sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const db = await getDb();
    const dossiers = await fetchAll(db, "SELECT slug, date_creation FROM dossiers WHERE est_publie = 1 ORDER BY date_creation DESC");
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n';
    
    // Homepage
    xml += '  <url>\\n    <loc>https://www.dossier212.page/</loc>\\n    <changefreq>daily</changefreq>\\n    <priority>1.0</priority>\\n  </url>\\n';
    // Categories
    xml += '  <url>\\n    <loc>https://www.dossier212.page/categorie/maroc</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n';
    xml += '  <url>\\n    <loc>https://www.dossier212.page/categorie/monde</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n';
    
    // Dossiers
    for (const d of dossiers) {
      xml += `  <url>\\n    <loc>https://www.dossier212.page/dossier/${d.slug}</loc>\\n    <changefreq>monthly</changefreq>\\n    <priority>0.9</priority>\\n  </url>\\n`;
    }
    
    xml += '</urlset>';
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});
"""

if '/sitemap.xml' not in js_content:
    js_content = js_content.replace("module.exports = router;", sitemap_code + "\nmodule.exports = router;")
    with open(public_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

# 2. ENHANCE INDEX.EJS META TAGS
index_path = 'views/public/index.ejs'
with open(index_path, 'r', encoding='utf-8') as f:
    index_html = f.read()

index_meta = """  <title><%= typeof pageTitle !== 'undefined' ? pageTitle + ' - DOSSIER 212' : 'DOSSIER 212 - ' + t.signature %></title>
  <meta name="description" content="<%= t.description %>">
  <!-- Open Graph / SEO -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.dossier212.page/">
  <meta property="og:title" content="DOSSIER 212">
  <meta property="og:description" content="<%= t.description %>">
  <meta property="og:image" content="https://www.dossier212.page/favicon.png">
  <meta name="twitter:card" content="summary_large_image">
"""
if 'og:type' not in index_html:
    index_html = re.sub(r'<title>.*?</title>\s*<meta name="description".*?>', index_meta, index_html)
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_html)

# 3. ENHANCE DOSSIER.EJS META TAGS
dossier_path = 'views/public/dossier.ejs'
with open(dossier_path, 'r', encoding='utf-8') as f:
    dossier_html = f.read()

dossier_meta = """  <title><%= typeof pageTitle !== 'undefined' ? pageTitle + ' — DOSSIER 212' : 'DOSSIER 212' %></title>
  <meta name="description" content="<%= (typeof lang !== 'undefined' && lang === 'en' && dossier.introduction_en) ? dossier.introduction_en : dossier.introduction_fr %>">
  <!-- Open Graph / SEO -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://www.dossier212.page/dossier/<%= dossier.slug %>">
  <meta property="og:title" content="<%= typeof pageTitle !== 'undefined' ? pageTitle : 'DOSSIER 212' %>">
  <meta property="og:description" content="<%= (typeof lang !== 'undefined' && lang === 'en' && dossier.introduction_en) ? dossier.introduction_en : dossier.introduction_fr %>">
  <meta property="og:image" content="<%= (typeof images !== 'undefined' && images.length > 0) ? images[0].chemin : 'https://www.dossier212.page/favicon.png' %>">
  <meta name="twitter:card" content="summary_large_image">
"""
if 'og:type' not in dossier_html:
    dossier_html = re.sub(r'<title>.*?</title>\s*<meta name="description".*?>', dossier_meta, dossier_html)
    with open(dossier_path, 'w', encoding='utf-8') as f:
        f.write(dossier_html)

print("SEO tags and Sitemap injected successfully!")
