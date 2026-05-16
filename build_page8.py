import os
import io
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
import reportlab.lib.utils as utils
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

W, H = A4

def draw_page_8_dashboard(c: canvas.Canvas, data: dict, assets_path: str):
    # 1. Background
    main_tree_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "public", "products", "Still_Strom-v1.png")
    c.saveState()
    
    if os.path.exists(main_tree_path):
        c.drawImage(main_tree_path, 0, 0, width=W, height=H, preserveAspectRatio=False)
    
    # Moderate overlay so text is readable but tree is visible
    c.setFillColor(colors.Color(0.06, 0.08, 0.12, alpha=0.5))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()
    
    # 2. LOGO
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "public", "branding", "logo_horizontal.png")
    
    if os.path.exists(logo_path):
        c.drawImage(logo_path, W / 2 - 150, H / 2 + 50, width=300, preserveAspectRatio=True, mask='auto')
    else:
        c.setFillColor(colors.white)
        c.setFont("Roboto-Bold", 40)
        c.drawCentredString(W / 2, H / 2 + 50, "TREETINO")
    
    # 3. SLOGAN
    c.setFont("Roboto-Bold", 24)
    c.drawCentredString(W / 2, H / 2, "Budoucnost energetiky zakořeněná")
    c.drawCentredString(W / 2, H / 2 - 30, "v udržitelnosti")
    
    # 4. FOOTER CONTACT
    c.setFont("Roboto-Bold", 16)
    c.drawCentredString(W / 2, 100, "www.treetino.eu")
    c.drawCentredString(W / 2, 75, "+420 730 587 857")
    c.drawCentredString(W / 2, 50, "info@treetino.com")

if __name__ == "__main__":
    pdfmetrics.registerFont(TTFont("Roboto", "backend/app/fonts/Roboto-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("Roboto-Bold", "backend/app/fonts/Roboto-Bold.ttf"))
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    
    draw_page_8_dashboard(c, {}, "backend/app/assets")
    c.save()
    with open("page8_test.pdf", "wb") as f:
        f.write(buffer.getvalue())
    print("Saved page8_test.pdf")
