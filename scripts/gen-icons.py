"""
Generate PWA icons for Daily Life Manager.
- 192x192, 512x512 standard
- 512x512 maskable (with safe padding)
- 180x180 apple-touch-icon
All saved to /home/z/my-project/public/icons/
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/home/z/my-project/public/icons"
os.makedirs(OUT, exist_ok=True)

# Palette (match globals.css)
EMERALD = (16, 185, 129)        # primary
EMERALD_DARK = (5, 150, 105)
CREAM = (250, 248, 242)         # light bg
DARK_BG = (22, 26, 24)          # dark bg

# Try to load a nice font
def get_font(size):
    candidates = [
        "/usr/share/fonts/truetype/chinese/NotoSansSC-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_icon(size, maskable=False, apple=False):
    """Draw a rounded-square emerald icon with a white checkmark + calendar feel."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # For maskable, leave ~10% safe padding around the main shape
    if maskable:
        # Full-bleed background to fill the mask
        draw.rectangle([0, 0, size, size], fill=EMERALD)
        inner_pad = int(size * 0.18)
    else:
        # Rounded square background
        inner_pad = int(size * 0.08)
        radius = int(size * 0.22)
        draw.rounded_rectangle(
            [inner_pad, inner_pad, size - inner_pad, size - inner_pad],
            radius=radius,
            fill=EMERALD,
        )

    # Inner content area
    cx, cy = size // 2, size // 2

    # Draw a stylized "D" letter (for DailyLife) using a bold font
    font_size = int(size * 0.55)
    font = get_font(font_size)

    # Measure text
    text = "D"
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
    except Exception:
        tw, th = font_size // 2, font_size

    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1]

    # Draw the "D"
    draw.text((tx, ty), text, font=font, fill=CREAM)

    # Small accent dot (amber) bottom-right of the letter
    dot_r = max(4, size // 24)
    dot_x = cx + tw // 2 + dot_r
    dot_y = cy + th // 2 + dot_r
    # Make sure dot stays inside the rounded square
    max_x = size - inner_pad - dot_r - 4
    max_y = size - inner_pad - dot_r - 4
    dot_x = min(dot_x, max_x)
    dot_y = min(dot_y, max_y)
    draw.ellipse(
        [dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
        fill=(251, 191, 36),  # amber-400
    )

    return img


def main():
    # Standard icons
    for size in [192, 512]:
        img = draw_icon(size, maskable=False)
        path = f"{OUT}/icon-{size}x{size}.png"
        img.save(path, "PNG")
        print(f"Saved {path}")

    # Maskable icon (512)
    img = draw_icon(512, maskable=True)
    path = f"{OUT}/icon-512x512-maskable.png"
    img.save(path, "PNG")
    print(f"Saved {path}")

    # Apple touch icon (180) - square with no transparency
    img = draw_icon(180, maskable=False, apple=True)
    # Flatten alpha onto emerald bg
    bg = Image.new("RGBA", (180, 180), EMERALD)
    bg.alpha_composite(img)
    path = f"{OUT}/apple-touch-icon.png"
    bg.convert("RGB").save(path, "PNG")
    print(f"Saved {path}")

    # Favicon (32x32)
    img = draw_icon(32, maskable=False)
    path = "/home/z/my-project/public/favicon.ico"
    # Save as PNG-style ico (PIL converts)
    img_resized = img.resize((32, 32), Image.LANCZOS)
    img_resized.save(path, "ICO")
    print(f"Saved {path}")

    print("\nAll icons generated.")


if __name__ == "__main__":
    main()
