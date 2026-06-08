#!/usr/bin/env python3
"""Restaure les encadrés WP (vegourmet-panel-primary/secondary) perdus à la
migration, en enveloppant le contenu MDX EXISTANT dans <Callout variant="...">.

Source de vérité : le dump WP (content/recipes.json + posts.json), champ
`content.rendered`. On extrait chaque panel (variant + 1er et dernier bloc texte
= ancres), on retrouve la séquence correspondante dans le MDX migré (matching
normalisé, tolérant aux transformations Stage A guillemets/tirets), et on
enveloppe les blocs [début..fin] dans <Callout>. On NE réécrit PAS le texte.

Usage : python3 scripts/restore-callout-panels.py [--apply] [--slug <slug>]
Par défaut : DRY-RUN (rapport seulement).
"""
import json, re, os, sys, html, glob, unicodedata

ROOT = os.path.join(os.path.dirname(__file__), "..")
DUMP = os.path.join(ROOT, "..", "backups", "vegourmet", "2026-06-03", "content")

PANEL_RE = re.compile(
    r'<div class="wp-block-group vegourmet-panel-(primary|secondary)">(.*?)</div>\s*</div>',
    re.S,
)
BLOCK_RE = re.compile(r"<(p|li|h4)\b[^>]*>(.*?)</\1>", re.S)

def strip_tags(s):
    s = re.sub(r"<[^>]+>", " ", s)
    return html.unescape(s)

def norm(s):
    """Signature normalisée : minuscules, sans accents/ponctuation/guillemets,
    espaces compactés. Tolère les transformations Stage A (« » , tirets)."""
    s = strip_tags(s).lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def panel_anchors(html_src):
    """Retourne [(variant, first_sig, last_sig, nblocks)] pour chaque panel."""
    res = []
    for var, inner in PANEL_RE.findall(html_src):
        blocks = [strip_tags(m.group(2)) for m in BLOCK_RE.finditer(inner)]
        sigs = [norm(b) for b in blocks if norm(b)]
        if len(sigs) >= 1:
            res.append((var, sigs[0], sigs[-1], len(sigs)))
    return res

def load_dump():
    """slug -> liste d'ancres de panels."""
    out = {}
    for fn in ("recipes.json", "posts.json"):
        path = os.path.join(DUMP, fn)
        for r in json.load(open(path, encoding="utf-8")):
            slug = r.get("slug")
            c = r.get("content")
            src = c.get("rendered") if isinstance(c, dict) else (c or "")
            a = panel_anchors(src)
            if slug and a:
                out[slug] = a
    return out

def mdx_files():
    """slug (frontmatter) -> path."""
    out = {}
    for f in glob.glob(os.path.join(ROOT, "content", "**", "*.mdx"), recursive=True):
        txt = open(f, encoding="utf-8").read()
        m = re.search(r"^slug:\s*(.+)$", txt, re.M)
        if m:
            out[m.group(1).strip()] = f
    return out

def split_body(txt):
    """Sépare frontmatter et corps ; renvoie (prefix, body_blocks, sep).
    Les blocs sont séparés par lignes vides."""
    m = re.match(r"^(---\n.*?\n---\n)(.*)$", txt, re.S)
    if not m:
        return None, None
    fm, body = m.group(1), m.group(2)
    # blocs = segments séparés par >=1 ligne vide
    parts = re.split(r"\n[ \t]*\n", body)
    return fm, parts

def block_sig(block):
    # signature du bloc MDX (1re ligne significative)
    return norm(block)

def find_index(blocks, sig, start=0):
    if not sig:
        return -1
    key = sig[:40]
    for i in range(start, len(blocks)):
        bs = block_sig(blocks[i])
        if not bs:
            continue
        # match : préfixe dans un sens ou l'autre, OU containment (cas d'une
        # liste WP devenue un unique bloc MDX où le dernier <li> est interne).
        if bs == sig or bs.startswith(key) or sig.startswith(bs[:40]) or key in bs:
            return i
    return -1

def process_file(path, anchors, apply):
    txt = open(path, encoding="utf-8").read()
    if "<Callout" in txt:
        return ("skip-already", 0, 0)  # déjà des Callout (ex chocolat-dubai)
    fm, blocks = split_body(txt)
    if fm is None:
        return ("no-frontmatter", 0, 0)
    matched = 0
    wraps = []  # (start, end, variant)
    used = set()
    for var, first_sig, last_sig, n in anchors:
        s = find_index(blocks, first_sig)
        if s < 0 or s in used:
            continue
        # fin : cherche last_sig à partir de s, fenêtre raisonnable
        if last_sig == first_sig:
            e = s
        else:
            e = find_index(blocks, last_sig, s)
            if e < 0 or e - s > n + 4:  # garde-fou anti-débordement
                continue
        if any(i in used for i in range(s, e + 1)):
            continue
        wraps.append((s, e, var))
        used.update(range(s, e + 1))
        matched += 1
    if not wraps:
        return ("no-match", 0, len(anchors))
    # applique en partant de la fin pour ne pas décaler les indices
    for s, e, var in sorted(wraps, reverse=True):
        blocks[s] = f'<Callout variant="{var}">\n\n' + blocks[s]
        blocks[e] = blocks[e] + '\n\n</Callout>'
    if apply:
        new = fm + "\n\n".join(blocks)
        open(path, "w", encoding="utf-8").write(new)
    return ("ok", matched, len(anchors))

def main():
    apply = "--apply" in sys.argv
    only = None
    if "--slug" in sys.argv:
        only = sys.argv[sys.argv.index("--slug") + 1]
    dump = load_dump()
    files = mdx_files()
    tot_panels = sum(len(v) for v in dump.values())
    tot_matched = 0; files_ok = 0; files_partial = 0; files_nomatch = 0; missing = 0
    report = []
    for slug, anchors in sorted(dump.items()):
        if only and slug != only:
            continue
        path = files.get(slug)
        if not path:
            missing += 1
            report.append(f"  MANQUE-MDX  {slug} ({len(anchors)} panels)")
            continue
        status, matched, total = process_file(path, anchors, apply)
        tot_matched += matched
        if status == "ok" and matched == total:
            files_ok += 1
        elif status == "ok":
            files_partial += 1
            report.append(f"  PARTIEL {matched}/{total}  {slug}")
        elif status == "skip-already":
            report.append(f"  DÉJÀ-CALLOUT  {slug}")
        else:
            files_nomatch += 1
            report.append(f"  {status} 0/{total}  {slug}")
    print(("=== APPLIQUÉ ===" if apply else "=== DRY-RUN ==="))
    print(f"Panels dump : {tot_panels} | enveloppés : {tot_matched}")
    print(f"Fichiers : OK-complet {files_ok} | partiels {files_partial} | sans-match {files_nomatch} | MDX manquant {missing}")
    print("\n".join(report[:60]))

if __name__ == "__main__":
    main()
