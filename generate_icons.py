"""Generate Android launcher icons from the LiveTalk logo."""
from PIL import Image
import os
import sys

# Use the generated icon as source
source = sys.argv[1] if len(sys.argv) > 1 else None
if not source or not os.path.exists(source):
    print(f"Source file not found: {source}")
    sys.exit(1)

img = Image.open(source).convert("RGBA")

# Android launcher icon sizes per density
sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# Foreground layer sizes (adaptive icons, 108dp equivalent)
fg_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

res_dir = os.path.join("android", "app", "src", "main", "res")

for folder, size in sizes.items():
    folder_path = os.path.join(res_dir, folder)
    os.makedirs(folder_path, exist_ok=True)

    # Resize for ic_launcher.png
    resized = img.resize((size, size), Image.LANCZOS)
    # Convert to RGB with sleek dark background (#0a0a0f) for legacy launcher
    bg = Image.new("RGB", (size, size), (10, 10, 15))
    bg.paste(resized, mask=resized.split()[3] if resized.mode == 'RGBA' else None)
    bg.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    
    # Round version
    bg_round = Image.new("RGB", (size, size), (10, 10, 15))
    bg_round.paste(resized, mask=resized.split()[3] if resized.mode == 'RGBA' else None)
    bg_round.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
    
    print(f"  {folder}: {size}x{size}px ✓")

# Generate foreground layers for adaptive icons
for folder, size in fg_sizes.items():
    folder_path = os.path.join(res_dir, folder)
    # Center the icon in the foreground layer with padding
    icon_size = int(size * 0.65)  # 65% of foreground area
    resized = img.resize((icon_size, icon_size), Image.LANCZOS)
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = (size - icon_size) // 2
    fg.paste(resized, (offset, offset))
    fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
    print(f"  {folder} foreground: {size}x{size}px ✓")

# Also save a copy for the web public folder
web_icon = img.resize((512, 512), Image.LANCZOS)
web_icon.save(os.path.join("public", "logo.png"), "PNG")
print("  public/logo.png: 512x512px ✓")

print("\n✅ All icons generated!")
