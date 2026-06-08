#!/usr/bin/env python3
"""Audit des marqueurs IA dans le corpus MDX vegourmet.

Deux familles :
  - TYPOGRAPHIQUES (mécaniques, corrigés par fix-typographie.py) :
    tiret cadratin, tiret demi-cadratin, guillemets anglais, flèches, signe ×.
  - LEXICAUX (jugement humain/LLM) : clichés et tournures « IA » FR.

Usage : python3 scripts/de-ai/audit-ai-markers.py [--json]
"""
import os, re, sys, json, glob

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
CONTENT = os.path.join(os.path.dirname(__file__), "..", "..", "content")

TYPO = {
    "em_dash":        "—",          # —
    "en_dash":        "–",          # –
    "quote_open_en":  "“",          # "
    "quote_close_en": "”",          # "
    "arrow_r":        "→",          # →
    "arrow_l":        "←",          # ←
    "arrow_dbl":      "⇒",          # ⇒
    "times_sign":     "×",          # ×
    "bullet_mid":     "•",          # •
}

# Clichés / tournures IA FR (word-boundary, insensible à la casse)
LEXICAL = [
    r"v[ée]ritable", r"odyss[ée]e", r"symphonie", r"ballet", r"valse",
    r"plong[eé]\w*\s+au\s+c[œo]ur", r"plong[ée]e\s+au\s+c[œo]ur",
    r"que\s+demander\s+de\s+plus", r"n'attend(ez|s)\s+plus",
    r"incontournable", r"[àa]\s+couper\s+le\s+souffle",
    r"ravir\w*", r"r[ée]galer\w*", r"[ée]merveill\w*",
    r"constellation", r"[ée]picentre", r"[ée]crin", r"p[ée]pite",
    r"sublim\w+", r"magique", r"magie",
    r"voyage\s+(culinaire|gustatif)", r"exp[ée]rience\s+(culinaire|gustative|inoubliable)",
    r"savant\s+(m[ée]lange|dosage|[ée]quilibre)",
    r"alliant", r"mariant", r"conjuguant",
    r"transcend\w+", r"m[ée]tamorphos\w+", r"regorge\w*",
    r"ind[ée]niablement", r"assur[ée]ment", r"incontestablement",
    r"force\s+est\s+de\s+constater", r"il\s+convient\s+de",
    r"non\s+seulement.{0,40}mais\s+aussi",
    r"que\s+vous\s+soyez.{0,40}ou",
    r"dans\s+cet\s+article,?\s+(nous|je)",
    r"[àa]\s+l'[èe]re\s+du", r"[àa]\s+l'heure\s+o[ùu]",
    r"le\s+secret\s+r[ée]side", r"r[ée]side\s+dans",
    r"qu'on\s+se\s+le\s+dise", r"en\s+somme", r"en\s+d[ée]finitive",
    r"plus\s+qu'un\w*\s+\w+,?\s+c'est", r"bien\s+plus\s+qu'un",
    r"univers\s+(culinaire|gustatif|des\s+saveurs)",
    r"explosion\s+de\s+saveurs", r"festival\s+de\s+saveurs",
    r"r[ée]volution\w*", r"game\s*changer",
]
LEX_RE = [(p, re.compile(p, re.IGNORECASE)) for p in LEXICAL]

def audit_file(path):
    txt = open(path, encoding="utf-8").read()
    typo = {k: txt.count(v) for k, v in TYPO.items()}
    lex = {}
    for pat, rx in LEX_RE:
        n = len(rx.findall(txt))
        if n:
            lex[pat] = n
    typo_total = sum(typo.values())
    lex_total = sum(lex.values())
    return {
        "typo": {k: v for k, v in typo.items() if v},
        "typo_total": typo_total,
        "lex": lex,
        "lex_total": lex_total,
        "score": typo_total + lex_total,
    }

def main():
    files = sorted(glob.glob(os.path.join(CONTENT, "**", "*.mdx"), recursive=True))
    rows = []
    g_typo = {}; g_lex = {}
    for f in files:
        r = audit_file(f)
        rel = os.path.relpath(f, os.path.join(os.path.dirname(__file__), "..", ".."))
        rows.append((rel, r))
        for k, v in r["typo"].items(): g_typo[k] = g_typo.get(k, 0) + v
        for k, v in r["lex"].items(): g_lex[k] = g_lex.get(k, 0) + v
    rows.sort(key=lambda x: x[1]["score"], reverse=True)

    if "--json" in sys.argv:
        print(json.dumps({"rows": [{"file": f, **r} for f, r in rows]}, ensure_ascii=False))
        return

    print(f"=== {len(files)} fichiers MDX audités ===\n")
    print(f"{'TYPO':>5} {'LEX':>5} {'TOT':>5}  fichier")
    files_typo = sum(1 for _, r in rows if r["typo_total"])
    files_lex = sum(1 for _, r in rows if r["lex_total"])
    for f, r in rows:
        if r["score"] == 0: continue
        print(f"{r['typo_total']:>5} {r['lex_total']:>5} {r['score']:>5}  {f}")
    print(f"\n=== TOTAUX ===")
    print(f"Fichiers avec marqueurs typo : {files_typo}/{len(files)}")
    print(f"Fichiers avec marqueurs lex  : {files_lex}/{len(files)}")
    print(f"\nTypographiques (total occurrences) :")
    for k, v in sorted(g_typo.items(), key=lambda x: -x[1]):
        print(f"  {v:>5}  {k} ({TYPO[k]})")
    print(f"  ----- {sum(g_typo.values())} total typo")
    print(f"\nLexicaux (top 25) :")
    for k, v in sorted(g_lex.items(), key=lambda x: -x[1])[:25]:
        print(f"  {v:>5}  {k}")
    print(f"  ----- {sum(g_lex.values())} total lex")

if __name__ == "__main__":
    main()
