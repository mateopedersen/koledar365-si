"""Render original editorial covers from the article's four practical checkpoints."""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "public/fonts/DejaVuSans.ttf"
ARTICLES = ROOT / "data/blog/articles.json"
OUTPUT = ROOT / "public/images/blog"
THEMES = {
    "Koledar": ((11, 40, 67), (21, 71, 92), "#d1f4ef", "#81ded4", "#175e70"),
    "Delo in dopust": ((46, 28, 68), (83, 62, 93), "#fff0db", "#ffca91", "#814c60"),
    "Šola": ((18, 40, 78), (48, 65, 115), "#eaf0ff", "#bccfff", "#455aa3"),
    "Načrtovanje": ((15, 51, 48), (42, 78, 64), "#f0ffe8", "#b7e4ac", "#336e58"),
    "Sonce in Luna": ((18, 31, 63), (66, 59, 99), "#fff1da", "#ffd088", "#725379"),
}


def font(size):
    return ImageFont.truetype(str(FONT), size)


def wrapped(draw, text, available_width, style):
    rows = []
    line = ""
    for word in text.split():
        candidate = f"{line} {word}".strip()
        if line and draw.textlength(candidate, font=style) > available_width:
            rows.append(line)
            line = word
        else:
            line = candidate
    if line:
        rows.append(line)
    return rows


def render(article):
    dark, light, ink, accent, card = THEMES[article["category"]]
    image = Image.new("RGB", (1200, 630))
    draw = ImageDraw.Draw(image)
    for y in range(630):
        amount = y / 629
        color = tuple(round(a + (b - a) * amount) for a, b in zip(dark, light))
        draw.line((0, y, 1199, y), fill=color)
    draw.rounded_rectangle((38, 36, 1161, 593), radius=34, outline=card, width=2)
    draw.text((68, 56), f"KOLEDAR365   /   {article['category'].upper()}", font=font(22), fill=accent)
    title = article["title"]
    headline = font(50)
    lines = wrapped(draw, title, 1060, headline)
    if len(lines) > 2:
        headline = font(44)
        lines = wrapped(draw, title, 1060, headline)
    for line_number, line in enumerate(lines):
        draw.text((66, 118 + line_number * 64), line, font=headline, fill=ink, stroke_width=1)
    draw.text((68, 307), "PRIMER IZ VODNIKA", font=font(18), fill=accent)
    labels = article["image_labels"]
    assert len(labels) == 4
    for index, label in enumerate(labels):
        left = 67 + index * 270
        draw.rounded_rectangle((left, 354, left + 249, 541), radius=24, fill=card, outline=accent, width=2)
        draw.ellipse((left + 19, 373, left + 60, 414), fill=accent)
        draw.text((left + 39.5, 394), str(index + 1), font=font(22), anchor="mm", fill=dark)
        if index < 3:
            x = left + 251
            draw.line((x, 453, x + 15, 453), fill=accent, width=2)
            draw.line((x + 9, 447, x + 15, 453, x + 9, 459), fill=accent, width=2)
        for line_number, row in enumerate(wrapped(draw, label, 212, font(27))):
            draw.text((left + 20, 432 + line_number * 34), row, font=font(27), fill=ink)
    return image


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for slug, article in json.loads(ARTICLES.read_text()).items():
        render(article).save(OUTPUT / f"{slug}.webp", "WEBP", quality=88, method=6)


if __name__ == "__main__":
    main()
