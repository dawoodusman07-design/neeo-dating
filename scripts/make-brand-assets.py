#!/usr/bin/env python3
"""Generates app icon, Android adaptive icon layers, splash and favicon from brand tokens.
Usage: python3 scripts/make-brand-assets.py   (needs Pillow)"""
from PIL import Image, ImageDraw, ImageFont
import os

FONT = 'node_modules/@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'
ACTION, BRAND_DEEP, BG, WHITE = (189, 40, 88), (116, 49, 91), (255, 250, 253), (255, 255, 255)

def centered_text(img, text, size, fill, dy=0):
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT, size)
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    W, H = img.size
    d.text(((W - (r - l)) / 2 - l, (H - (b - t)) / 2 - t + dy), text, font=f, fill=fill)

def gradient(size):
    img = Image.new('RGB', (size, size))
    for y in range(size):
        k = y / size
        c = tuple(round(ACTION[i] * (1 - k) + BRAND_DEEP[i] * k) for i in range(3))
        ImageDraw.Draw(img).line([(0, y), (size, y)], fill=c)
    return img

os.makedirs('assets', exist_ok=True)
icon = gradient(1024)
centered_text(icon, 'n', 640, WHITE, dy=-30)
icon.save('assets/icon.png')

fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))   # adaptive: content within 66% safe zone
centered_text(fg, 'n', 420, WHITE, dy=-20)
fg.save('assets/android-icon-foreground.png')
gradient(1024).save('assets/android-icon-background.png')
mono = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
centered_text(mono, 'n', 420, (0, 0, 0, 255), dy=-20)
mono.save('assets/android-icon-monochrome.png')

splash = Image.new('RGBA', (600, 600), (0, 0, 0, 0))
centered_text(splash, 'neeo', 190, ACTION + (255,))
splash.save('assets/splash-icon.png')
icon.resize((48, 48), Image.LANCZOS).save('assets/favicon.png')
print('brand assets written to assets/')
