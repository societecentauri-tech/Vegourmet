#!/usr/bin/env python3
"""Stage A dé-IA — conversion déterministe des guillemets anglais en guillemets
français, avec espace fine insécable (U+202F) à l'intérieur.

  “texte”  ->  « texte »

C'est la seule transformation typographique 100% sûre (aucune ambiguïté de
contexte). Les tirets, flèches et le lexical sont traités par les sous-agents
LLM (Stage B) car ils demandent une lecture du contexte.

Usage : python3 scripts/de-ai/fix-quotes.py [--check]
"""
import os, glob, sys

CONTENT = os.path.join(os.path.dirname(__file__), "..", "..", "content")
NNBSP = " "  # narrow no-break space
OPEN_EN, CLOSE_EN = "“", "”"          # “ ”
OPEN_FR, CLOSE_FR = "«" + NNBSP, NNBSP + "»"  # « ... »

def convert(txt):
    return txt.replace(OPEN_EN, OPEN_FR).replace(CLOSE_EN, CLOSE_FR)

def main():
    check = "--check" in sys.argv
    files = sorted(glob.glob(os.path.join(CONTENT, "**", "*.mdx"), recursive=True))
    changed = 0; total = 0
    for f in files:
        txt = open(f, encoding="utf-8").read()
        n = txt.count(OPEN_EN) + txt.count(CLOSE_EN)
        if not n:
            continue
        total += n
        changed += 1
        if not check:
            open(f, "w", encoding="utf-8").write(convert(txt))
    verb = "à convertir" if check else "convertis"
    print(f"{total} guillemets anglais {verb} dans {changed} fichiers")

if __name__ == "__main__":
    main()
