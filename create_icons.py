from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # Create a new image with a white background
    image = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(image)
    
    # Draw a shield shape
    shield_color = (52, 152, 219)  # Blue color
    border_color = (41, 128, 185)  # Darker blue for border
    
    # Calculate shield dimensions
    shield_width = int(size * 0.8)
    shield_height = int(size * 0.9)
    shield_left = (size - shield_width) // 2
    shield_top = (size - shield_height) // 2
    
    # Draw shield border
    draw.rectangle(
        [(shield_left, shield_top), 
         (shield_left + shield_width, shield_top + shield_height)],
        outline=border_color,
        width=max(1, size // 16)
    )
    
    # Draw shield fill
    draw.rectangle(
        [(shield_left + size//16, shield_top + size//16),
         (shield_left + shield_width - size//16, shield_top + shield_height - size//16)],
        fill=shield_color
    )
    
    # Draw checkmark
    check_color = (255, 255, 255)  # White color
    check_width = int(size * 0.4)
    check_height = int(size * 0.3)
    check_left = (size - check_width) // 2
    check_top = (size - check_height) // 2
    
    # Draw checkmark lines
    line_width = max(1, size // 16)
    draw.line(
        [(check_left, check_top + check_height//2),
         (check_left + check_width//3, check_top + check_height),
         (check_left + check_width, check_top)],
        fill=check_color,
        width=line_width
    )
    
    return image

def main():
    # Create icons directory if it doesn't exist
    if not os.path.exists('icons'):
        os.makedirs('icons')
    
    # Generate icons of different sizes
    sizes = [16, 48, 128]
    for size in sizes:
        icon = create_icon(size)
        icon.save(f'icons/icon{size}.png')
        print(f'Created icon{size}.png')

if __name__ == '__main__':
    main() 