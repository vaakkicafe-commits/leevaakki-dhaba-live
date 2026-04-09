from PIL import Image, ImageDraw, ImageFont

def create_splash(width, height, output_path):
    # Create image with green background
    img = Image.new('RGB', (width, height), '#2E7D32')
    draw = ImageDraw.Draw(img)
    
    # Draw centered logo
    logo_size = min(width, height) // 3
    logo_x = (width - logo_size) // 2
    logo_y = (height - logo_size) // 2 - 50
    
    # Orange circle (curry bowl)
    bowl_size = int(logo_size * 0.7)
    bowl_x = logo_x + (logo_size - bowl_size) // 2
    bowl_y = logo_y + int(logo_size * 0.1)
    draw.ellipse([bowl_x, bowl_y, bowl_x + bowl_size, bowl_y + bowl_size], fill='#FF6B35')
    
    # Inner lighter circle
    inner_size = int(bowl_size * 0.75)
    inner_x = bowl_x + (bowl_size - inner_size) // 2
    inner_y = bowl_y + int(bowl_size * 0.15)
    draw.ellipse([inner_x, inner_y, inner_x + inner_size, inner_y + int(inner_size * 0.55)], fill='#FFA726')
    
    # Draw restaurant name
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    title = "Lee Vaakki Dhaba"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = logo_y + logo_size + 30
    draw.text((text_x, text_y), title, fill='white', font=title_font)
    
    subtitle = "Authentic North Indian Cuisine"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    sub_width = bbox[2] - bbox[0]
    sub_x = (width - sub_width) // 2
    sub_y = text_y + 60
    draw.text((sub_x, sub_y), subtitle, fill='#FFFFFF99', font=subtitle_font)
    
    img.save(output_path, 'PNG')
    print(f"Created: {output_path}")

import os

# Create drawable directories
drawable_dirs = ['drawable', 'drawable-land-hdpi', 'drawable-land-mdpi', 'drawable-land-xhdpi', 
                 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi', 'drawable-port-hdpi', 
                 'drawable-port-mdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 
                 'drawable-port-xxxhdpi']

res_path = '/app/frontend/android/app/src/main/res'

for dir_name in drawable_dirs:
    dir_path = f'{res_path}/{dir_name}'
    os.makedirs(dir_path, exist_ok=True)
    
    if 'land' in dir_name:
        create_splash(1920, 1080, f'{dir_path}/splash.png')
    else:
        create_splash(1080, 1920, f'{dir_path}/splash.png')

print("\nSplash screens created!")
