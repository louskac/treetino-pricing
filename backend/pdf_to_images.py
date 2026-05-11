import fitz
import sys

def convert():
    doc = fitz.open("output.pdf")
    for i in range(len(doc)):
        page = doc.load_page(i)
        pix = page.get_pixmap(dpi=150)
        pix.save(f"page_{i+1}.png")
        print(f"Saved page_{i+1}.png")
    
if __name__ == "__main__":
    convert()
