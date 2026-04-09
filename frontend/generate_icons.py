from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    # Create image with green background
    img = Image.new('RGB', (size, size), '#2E7D32')
    draw = ImageDraw.Draw(img)
    
    # Draw orange circle (curry bowl)
    bowl_size = int(size * 0.5)
    bowl_x = (size - bowl_size) // 2
    bowl_y = int(size * 0.15)
    draw.ellipse([bowl_x, bowl_y, bowl_x + bowl_size, bowl_y + bowl_size], fill='#FF6B35')
    
    # Draw inner lighter circle
    inner_size = int(bowl_size * 0.8)
    inner_x = bowl_x + (bowl_size - inner_size) // 2
    inner_y = bowl_y + int(bowl_size * 0.15)
    draw.ellipse([inner_x, inner_y, inner_x + inner_size, inner_y + int(inner_size * 0.6)], fill='#FFA726')
    
    # Draw "LV" text
    font_size = int(size * 0.25)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "LV"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2
    text_y = int(size * 0.65)
    draw.text((text_x, text_y), text, fill='white', font=font)
    
    img.save(output_path, 'PNG')
    print(f"Created: {output_path}")

# Create icons directory
os.makedirs('/app/frontend/public/icons', exist_ok=True)

# Generate PWA icons
pwa_sizes = [72, 96, 128, 144, 152, 192, 384, 512]
for size in pwa_sizes:
    create_icon(size, f'/app/frontend/public/icons/icon-{size}x{size}.png')

# Generate Android icons (mipmap directories)
android_icons = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
}

android_res_path = '/app/frontend/android/app/src/main/res'
for density, size in android_icons.items():
    dir_path = f'{android_res_path}/mipmap-{density}'
    os.makedirs(dir_path, exist_ok=True)
    create_icon(size, f'{dir_path}/ic_launcher.png')
    # Create round version
    create_icon(size, f'{dir_path}/ic_launcher_round.png')
    # Create foreground for adaptive icons
    create_icon(size, f'{dir_path}/ic_launcher_foreground.png')

print("\nAll icons generated successfully!")
