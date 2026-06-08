#!/usr/bin/env python3
"""Extrait le bloc « Produits sélectionnés par Chloé » de TOUTES les recettes.

Le WP live embarque un objet JS global keyé par slug :
  "<slug>": { title: "...", products: [ {name,url,imageURL,avis}, ... ] }
présent sur chaque page recette. Un seul fetch suffit. On télécharge les images
produit (rapatriement S3) et on génère lib/product-picks.json.

Usage : python3 scripts/scrape-product-picks.py
Sortie : lib/product-picks.json + /tmp/picks-img/<sha1>.<ext> (à uploader S3).
"""
import json, re, os, html, hashlib, urllib.request, ssl

ROOT = os.path.join(os.path.dirname(__file__), "..")
IMG_DIR = "/tmp/picks-img"
OUT = os.path.join(ROOT, "lib", "product-picks.json")
S3_BASE = "https://veg.s3.fr-par.scw.cloud/img/picks"
SEED_URL = "https://vegourmet.fr/recettes/fraisier-vegan-classique-de-la-patisserie/"
CTX = ssl.create_default_context()
os.makedirs(IMG_DIR, exist_ok=True)

ENTRY_RE = re.compile(
    r'"([a-z0-9][a-z0-9-]+)":\s*\{\s*title:\s*"([^"]*)"\s*,\s*products:\s*\[(.*?)\]\s*\}',
    re.S,
)
PROD_RE = re.compile(
    r'\{\s*name:\s*"([^"]*)"\s*,\s*url:\s*"([^"]*)"\s*,\s*'
    r'imageURL:\s*"([^"]*)"\s*,\s*avis:\s*"([^"]*)"\s*\}',
    re.S,
)
CTA_RE = re.compile(r'<a href="(https://c3po[^"]+)"[^>]*>\s*<div[^>]*>\s*🛒\s*Commander en 1 clic', re.S)

def clean(s):
    return html.unescape(s).replace("\\'", "'").replace('\\"', '"').strip()

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=40, context=CTX).read()

_imgcache = {}
def localize(url):
    if url in _imgcache:
        return _imgcache[url]
    try:
        data = fetch(url)
    except Exception as e:
        print(f"    img KO {url} : {e}")
        _imgcache[url] = url
        return url
    ext = os.path.splitext(url.split("?")[0])[1].lower() or ".jpg"
    sha = hashlib.sha1(data).hexdigest()[:16]
    fn = f"{sha}{ext}"
    open(os.path.join(IMG_DIR, fn), "wb").write(data)
    s3 = f"{S3_BASE}/{fn}"
    _imgcache[url] = s3
    return s3

def main():
    # Slugs réellement présents dans le repo (pour ne garder que les recettes migrées)
    import glob
    repo_slugs = set()
    for f in glob.glob(os.path.join(ROOT, "content", "recettes", "*.mdx")):
        m = re.search(r"^slug:\s*(.+)$", open(f, encoding="utf-8").read(), re.M)
        if m:
            repo_slugs.add(m.group(1).strip())

    doc = fetch(SEED_URL).decode("utf-8", "replace")
    cta_m = CTA_RE.search(doc)
    cta = cta_m.group(1) if cta_m else None

    data = {}
    skipped = 0
    for slug, title, body in ENTRY_RE.findall(doc):
        if slug not in repo_slugs:
            skipped += 1
            continue
        prods = []
        for name, url, img, avis in PROD_RE.findall(body):
            prods.append({
                "name": clean(name),
                "url": url,
                "image": localize(img),
                "description": clean(avis).strip('"« »'),
            })
        if prods:
            data[slug] = {"title": clean(title), "products": prods, "ctaUrl": cta}

    json.dump(data, open(OUT, "w"), ensure_ascii=False, indent=1)
    tot = sum(len(v["products"]) for v in data.values())
    print(f"{len(data)} recettes avec bloc ({tot} produits), {skipped} slugs hors-repo ignorés.")
    print(f"CTA global : {cta}")
    print(f"-> {OUT} | images {IMG_DIR} : {len(os.listdir(IMG_DIR))}")

if __name__ == "__main__":
    main()
