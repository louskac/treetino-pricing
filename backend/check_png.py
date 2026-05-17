from PIL import Image
img = Image.open('backend/app/assets/top_view.png')
print("Size:", img.size)
bbox = img.getbbox()
print("BBox:", bbox)
