#!/usr/bin/env python3
"""Generate the 1200x630 social/Slack unfurl card (static/og.png).

Composites the camp title logo and a date tagline over the forest art.
Run from the `landing` dir: python3 scripts/make-og.py
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630

# Forest background, scaled to cover the card.
bg = Image.open("static/forest.png").convert("RGB")
scale = max(W / bg.width, H / bg.height)
bg = bg.resize((round(bg.width * scale), round(bg.height * scale)), Image.LANCZOS)
left = (bg.width - W) // 2
top = (bg.height - H) // 2
card = bg.crop((left, top, left + W, top + H))

# Slight dark gradient at the bottom so the tagline stays readable.
overlay = Image.new("L", (1, H), 0)
for y in range(H):
    t = max(0.0, (y - H * 0.55) / (H * 0.45))
    overlay.putpixel((0, y), int(150 * t))
overlay = overlay.resize((W, H))
shade = Image.new("RGB", (W, H), (20, 30, 15))
card = Image.composite(shade, card, overlay)

# Title logo, centered in the upper area.
title = Image.open("static/title.png").convert("RGBA")
tw = int(W * 0.78)
th = round(tw * title.height / title.width)
title = title.resize((tw, th), Image.LANCZOS)
card.paste(title, ((W - tw) // 2, int(H * 0.20)), title)

# Date tagline, auto-sized to fit within side margins.
draw = ImageDraw.Draw(card)
text = "June 29 – July 17  •  Weekdays 12–3 PM ET  •  Free & online"
max_w = W - 100
size = 46
while size > 20:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", size)
    bbox = draw.textbbox((0, 0), text, font=font)
    if bbox[2] - bbox[0] <= max_w:
        break
    size -= 2
x = (W - (bbox[2] - bbox[0])) // 2
y = int(H * 0.74)
# Shadow then fill for contrast over the art.
draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0))
draw.text((x, y), text, font=font, fill=(255, 244, 230))

card.save("static/og.png", optimize=True)
print("wrote static/og.png", card.size)
