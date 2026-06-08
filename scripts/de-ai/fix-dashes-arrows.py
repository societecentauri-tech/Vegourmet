#!/usr/bin/env python3
"""Stage A2 dé-IA — tirets d'incise et flèches.

  mot — mot   /   mot – mot   ->   mot, mot     (incise IA -> virgule FR)
  X → Y                        ->   X : Y         (mapping probleme->solution)

PROTÈGE les attributions de citation « ... » — Auteur (tiret conservé, traité
par le LLM en Stage B pour générifier/retirer les fausses citations).
Ne touche PAS aux puces • (séparateurs inline légitimes) ni aux blocs de code
(aucun dans le corpus, vérifié).

Usage : python3 scripts/de-ai/fix-dashes-arrows.py [--check]
"""
import os, re, glob, sys

CONTENT = os.path.join(os.path.dirname(__file__), "..", "..", "content")
WS = r"[ \t  ]"

ATTR_RE  = re.compile(r"(»\s*)([—–])(\s+[A-ZÀ-Þ])")       # citation -> protéger
DASH_RE  = re.compile(WS + r"*[—–]" + WS + r"+")            # incise -> ", "
ARROW_RE = re.compile(WS + r"*→" + WS + r"*")               # flèche -> " : "

def convert(txt):
    txt = ATTR_RE.sub(lambda m: m.group(1) + "\x00" + m.group(2) + "\x00" + m.group(3), txt)
    txt = DASH_RE.sub(", ", txt)
    txt = ARROW_RE.sub(" : ", txt)
    txt = txt.replace("\x00", "")          # restaure les attributions protégées
    return txt

def main():
    check = "--check" in sys.argv
    files = sorted(glob.glob(os.path.join(CONTENT, "**", "*.mdx"), recursive=True))
    files_changed = 0; dashes = 0; arrows = 0; protected = 0
    for f in files:
        txt = open(f, encoding="utf-8").read()
        protected += len(ATTR_RE.findall(txt))
        new = convert(txt)
        if new != txt:
            files_changed += 1
            if not check:
                open(f, "w", encoding="utf-8").write(new)
    print(f"{files_changed} fichiers modifiés ; {protected} attributions de citation protégées (réservées au LLM)")

if __name__ == "__main__":
    main()
