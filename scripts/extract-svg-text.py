#!/usr/bin/env python3
"""Extracts visible <text> content from reference-prototype/screens/*.svg into
reference-prototype/_extracted.json (one entry per SVG, in document order).
Usage: python3 -I scripts/extract-svg-text.py"""
import json, re, sys, xml.etree.ElementTree as ET
from pathlib import Path

root = Path(__file__).resolve().parent.parent / 'reference-prototype'
out = {}
for svg in sorted((root / 'screens').glob('*.svg')):
    try:
        tree = ET.parse(svg)
    except ET.ParseError as e:
        out[svg.stem] = {'error': str(e)}
        continue
    texts = []
    for el in tree.iter():
        if el.tag.split('}')[-1] == 'text':
            t = re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()
            if t:
                texts.append(t)
    out[svg.stem] = texts
(root / '_extracted.json').write_text(json.dumps(out, indent=1, ensure_ascii=False))
vera = [k for k, v in out.items() if any('vera' in t.lower() for t in (v if isinstance(v, list) else []))]
print(f'{len(out)} SVGs extracted; screens containing "Vera": {vera or "none"}')
