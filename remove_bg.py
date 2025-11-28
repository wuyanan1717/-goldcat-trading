from PIL import Image
import sys

def remove_background(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Check if the pixel is dark (background)
        # Adjust threshold as needed. Assuming background is dark grey/black.
        # If r, g, b are all less than a threshold, make it transparent.
        if item[0] < 100 and item[1] < 100 and item[2] < 100:
            newData.append((255, 255, 255, 0))
        else:
            # Keep the original color
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

if __name__ == "__main__":
    remove_background("public/goldcat_logo_latest.jpg", "public/goldcat_logo_transparent.png")
