import os

new_func = """def draw_page_6(c: canvas.Canvas, data: dict, assets_path: str):
    result = data.get("result", {})
    
    # Fonts & Colors
    TEXT_COLOR = colors.white
    MUTED_COLOR = colors.HexColor("#94a3b8")
    ACCENT_COLOR = colors.HexColor("#38bdf8")
    CARD_BG = colors.Color(0.12, 0.16, 0.23, alpha=0.8)
    LINE_COLOR = colors.HexColor("#334155")
    
    def format_czk(val):
        return "{:,.2f}".format(float(val)).replace(",", " ").replace(".", ",") + " Kč"
        
    def format_units(val):
        return "{:,.2f}".format(float(val)).replace(",", " ").replace(".", ",")

    total_before_discount = result.get("totalBeforeDiscount", 14700000)
    discount_percent = result.get('discountPercent', 5.0)
    discount_amount = result.get("discountAmount", 735000)
    final_price = result.get("finalPrice", 13965000)
    vat_percent = 21.0
    vat_amount = final_price * (vat_percent / 100.0)
    final_price_vat = final_price + vat_amount
    subsidy_amount = final_price * 0.30
    subsidy_price = result.get("subsidyPrice", final_price * 0.70)
    
    units_qty = 3 if final_price > 10000000 else 1
    unit_price = total_before_discount / units_qty
    client_name = data.get("clientName", "M - KOVO s.r.o.")

    # 1. Background
    import reportlab.lib.utils as utils
    from PIL import Image
    import io
    main_tree_path = os.path.join(assets_path, "products", "Still_Strom-v2.png")
    c.saveState()
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    
    if os.path.exists(main_tree_path):
        img_cover = utils.ImageReader(main_tree_path)
        img_w, img_h = img_cover.getSize()
        img_ratio = img_w / img_h
        page_ratio = W / H
        if img_ratio > page_ratio:
            draw_h = H
            draw_w = H * img_ratio
        else:
            draw_w = W
            draw_h = W / img_ratio
        
        offset_x = (W - draw_w) / 2
        offset_y = (H - draw_h) / 2
        # Use preserveAspectRatio=False to stretch and cover
        c.drawImage(main_tree_path, 0, 0, width=W, height=H, preserveAspectRatio=False)
    
    c.setFillColor(colors.Color(0.06, 0.08, 0.12, alpha=0.92))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()
    
    # 2. HEADER
    c.setFont("Roboto-Bold", 8)
    c.setFillColor(ACCENT_COLOR)
    c.drawString(40, H - 40, "FORMÁLNÍ NABÍDKA")
    
    c.setFont("Roboto-Bold", 28)
    c.setFillColor(TEXT_COLOR)
    c.drawString(40, H - 70, "NAB-26-024")
    
    c.setFont("Roboto", 9)
    c.setFillColor(MUTED_COLOR)
    c.drawString(40, H - 85, "Vystaveno: 2. 2. 2026")
    
    # 3. TOP CARDS (Supplier & Client)
    card_y = H - 220
    card_h = 110
    card_w = (W - 100) / 2
    
    # Supplier Card
    c.setFillColor(CARD_BG)
    c.roundRect(40, card_y, card_w, card_h, 6, fill=1, stroke=0)
    
    col1 = 55
    col2 = 160
    
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto-Bold", 11)
    c.drawString(col1, card_y + card_h - 25, "Treetino corp s.r.o.")
    c.setFont("Roboto", 9)
    c.setFillColor(MUTED_COLOR)
    c.drawString(col1, card_y + card_h - 40, "Česká republika")
    
    c.setFont("Roboto-Bold", 8)
    c.drawString(col1, card_y + card_h - 60, "Kancelář")
    c.setFont("Roboto", 8)
    c.setFillColor(TEXT_COLOR)
    c.drawString(col1, card_y + card_h - 72, "Vlčetin 62, Bílá 463 43")
    c.setFillColor(MUTED_COLOR)
    c.drawString(col1, card_y + card_h - 84, "IČ: 10800107")
    
    c.setFont("Roboto-Bold", 8)
    c.drawString(col2, card_y + card_h - 25, "Kontaktní osoba")
    c.setFillColor(TEXT_COLOR)
    c.drawString(col2, card_y + card_h - 37, "Dominik Mašek")
    c.setFont("Roboto", 8)
    c.setFillColor(MUTED_COLOR)
    c.drawString(col2, card_y + card_h - 49, "+420 730 587 857")
    c.setFillColor(ACCENT_COLOR)
    c.drawString(col2, card_y + card_h - 61, "info@wattino.eu")
    
    # Client Card
    right_card_x = 40 + card_w + 20
    c.setFillColor(CARD_BG)
    c.roundRect(right_card_x, card_y, card_w, card_h, 6, fill=1, stroke=0)
    
    col3 = right_card_x + 15
    col4 = right_card_x + 130
    
    c.setFont("Roboto-Bold", 8)
    c.setFillColor(MUTED_COLOR)
    c.drawString(col3, card_y + card_h - 25, "Odběratel")
    
    c.setFont("Roboto-Bold", 11)
    c.setFillColor(TEXT_COLOR)
    c.drawString(col3, card_y + card_h - 40, str(client_name))
    c.setFont("Roboto", 9)
    c.setFillColor(MUTED_COLOR)
    c.drawString(col3, card_y + card_h - 55, "Rantířov 143, 58841 Rantířov")
    c.drawString(col3, card_y + card_h - 70, "Česká republika")
    
    c.setFont("Roboto-Bold", 8)
    c.drawString(col3, card_y + 20, "IČO")
    c.drawString(col4, card_y + 20, "DIČ")
    c.setFillColor(TEXT_COLOR)
    c.drawString(col3, card_y + 8, "25515799")
    c.drawString(col4, card_y + 8, "CZ25515799")
    
    # 4. DETAILED PRICE BREAKDOWN
    table_y = H - 380
    table_h = 130
    c.setFillColor(CARD_BG)
    c.roundRect(40, table_y, W - 80, table_h, 6, fill=1, stroke=0)
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(TEXT_COLOR)
    c.drawString(55, table_y + table_h - 25, "Detailní rozpis ceny")
    c.setFont("Roboto-Bold", 7)
    c.setFillColor(MUTED_COLOR)
    c.drawRightString(W - 55, table_y + table_h - 25, "VŠECHNY CENY V CZK")
    
    c.setStrokeColor(LINE_COLOR)
    c.line(40, table_y + table_h - 40, W - 40, table_y + table_h - 40)
    
    # TIGHTER RIGHT ALIGNED HEADERS
    header_y = table_y + table_h - 55
    c.drawString(55, header_y, "POLOŽKA")
    c.drawRightString(235, header_y, "MNOŽ.")
    c.drawRightString(300, header_y, "CENA/JEDNOTKU")
    c.drawRightString(345, header_y, "SLEVA")
    c.drawRightString(415, header_y, "CELKEM BEZ DPH")
    c.drawRightString(475, header_y, "DPH (21%)")
    c.drawRightString(W - 50, header_y, "CELKEM S DPH")
    
    c.line(40, header_y - 10, W - 40, header_y - 10)
    
    row_y = header_y - 30
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(ACCENT_COLOR)
    c.drawString(55, row_y, "Strom V1")
    c.setFont("Roboto", 7)
    c.setFillColor(MUTED_COLOR)
    c.drawString(55, row_y - 10, "Kinetic Energy Generator Unit")
    
    c.setFillColor(TEXT_COLOR)
    c.drawRightString(235, row_y - 5, f"{units_qty} [1 kpl]")
    c.drawRightString(300, row_y - 5, format_czk(unit_price))
    
    c.setFillColor(colors.HexColor("#4c1d95"))
    c.roundRect(315, row_y - 10, 30, 12, 2, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#d8b4fe"))
    c.drawCentredString(330, row_y - 7, f"{format_units(discount_percent)}%")
    
    c.setFillColor(TEXT_COLOR)
    c.drawRightString(415, row_y - 5, format_czk(final_price))
    c.drawRightString(475, row_y - 5, format_czk(vat_amount))
    c.drawRightString(W - 50, row_y - 5, format_czk(final_price_vat))
    
    # 5. BOTTOM SECTION
    bottom_y = table_y - 200
    
    # Bottom Left - Expert Assessment
    c.setFillColor(CARD_BG)
    c.roundRect(40, bottom_y + 80, card_w, 100, 6, fill=1, stroke=0)
    c.setFillColor(ACCENT_COLOR)
    c.roundRect(40, bottom_y + 80, 4, 100, 2, fill=1, stroke=0)
    
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto-Bold", 10)
    c.drawString(60, bottom_y + 155, "Odborný posudek")
    
    c.setFont("Roboto", 8)
    c.setFillColor(MUTED_COLOR)
    text_lines = [
        "Cenová nabídka je prediktivní. Pro přesnou kalkulaci je",
        "nutná návštěva technika.",
        "V rámci podpory RES+ pro Vás rádi obstaráme dotaci",
        "v maximální možné výši, která se aktuálně pohybuje",
        "okolo 30 % na způsobilé náklady."
    ]
    for i, line in enumerate(text_lines):
        c.drawString(60, bottom_y + 135 - (i * 12), line)
        
    # Bottom Left - Estimated Savings
    c.setFillColor(CARD_BG)
    c.roundRect(40, bottom_y, card_w, 65, 6, fill=1, stroke=0)
    
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto-Bold", 8)
    c.drawString(60, bottom_y + 45, "Odhadovaná úspora po dotaci")
    c.setFont("Roboto", 7)
    c.setFillColor(MUTED_COLOR)
    c.drawString(60, bottom_y + 30, f"Po odečtení dotace by cena mohla být")
    c.drawString(60, bottom_y + 20, f"kolem {format_czk(subsidy_price)} bez DPH.")
    
    # Bottom Right - Totals
    c.setFillColor(CARD_BG)
    c.roundRect(right_card_x, bottom_y, card_w, 180, 6, fill=1, stroke=0)
    
    c.setFont("Roboto", 9)
    c.setFillColor(MUTED_COLOR)
    c.drawString(right_card_x + 20, bottom_y + 150, "Cena bez DPH")
    c.drawRightString(right_card_x + card_w - 20, bottom_y + 150, format_czk(final_price))
    
    c.drawString(right_card_x + 20, bottom_y + 130, "DPH (21%)")
    c.drawRightString(right_card_x + card_w - 20, bottom_y + 130, format_czk(vat_amount))
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(TEXT_COLOR)
    c.drawString(right_card_x + 20, bottom_y + 105, "Celková cena (vč. DPH)")
    c.drawRightString(right_card_x + card_w - 20, bottom_y + 105, format_czk(final_price_vat))
    
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(colors.HexColor("#f43f5e"))
    c.drawString(right_card_x + 20, bottom_y + 85, "Předpokládaná dotace (-30%)")
    c.drawRightString(right_card_x + card_w - 20, bottom_y + 85, f"- {format_czk(subsidy_amount)}")
    
    c.setFillColor(ACCENT_COLOR)
    c.roundRect(right_card_x, bottom_y + 15, card_w, 55, 6, fill=1, stroke=0)
    
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Roboto-Bold", 9)
    c.drawString(right_card_x + 15, bottom_y + 45, "Finální cena po dotaci")
    
    c.setFont("Roboto-Bold", 13)
    c.drawRightString(right_card_x + card_w - 15, bottom_y + 45, format_czk(subsidy_price))
    c.setFont("Roboto-Bold", 6)
    c.drawRightString(right_card_x + card_w - 15, bottom_y + 35, "ODHAD PO ODEČTENÍ DOTACE")
    
    c.setFont("Roboto-Bold", 7)
    c.setFillColor(colors.HexColor("#10b981"))
    discount_msg = f"Aplikována celková sleva: {format_czk(discount_amount)}"
    c.drawRightString(right_card_x + card_w, bottom_y - 10, discount_msg)
    
    # 6. BANNER SECTION (FULL WIDTH)
    banner_y = 0
    banner_h = 130
    c.setFillColor(colors.HexColor("#060b13")) # Solid dark for the bottom
    c.rect(0, banner_y, W, banner_h, fill=1, stroke=0)
    
    c.setFont("Roboto-Bold", 18)
    c.setFillColor(TEXT_COLOR)
    c.drawString(40, banner_y + 90, "Premiová konektivita")
    c.drawString(40, banner_y + 68, "Na 3 měsíce ")
    c.setFillColor(ACCENT_COLOR)
    c.drawString(40 + c.stringWidth("Na 3 měsíce ", "Roboto-Bold", 18), banner_y + 68, "Zdarma")
    
    c.setFont("Roboto", 9)
    c.setFillColor(TEXT_COLOR)
    bullets = [
        "AI systém optimalizace výroby",
        "Reakce na meteorologická data",
        "Světelná Show",
        "Možnosti sdílení"
    ]
    for idx, b in enumerate(bullets):
        by = banner_y + 95 - (idx * 20)
        c.circle(230, by + 3, 2, fill=1, stroke=0)
        c.drawString(240, by, b)
        
    btn_y = banner_y + 35
    c.setStrokeColor(TEXT_COLOR)
    c.roundRect(40, btn_y, 100, 25, 4, fill=0, stroke=1)
    c.setFont("Roboto-Bold", 8)
    c.drawCentredString(90, btn_y + 9, "Stáhnout aplikaci")
    
    c.linkURL("https://www.treetino.com", (40, btn_y, 140, btn_y + 25), relative=1)
    
    # Phone image
    phone_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "public", "phone.png")
    if os.path.exists(phone_path):
        c.drawImage(phone_path, W - 220, banner_y - 20, width=180, preserveAspectRatio=True, mask='auto')

    # Footer numbers
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, banner_y + 12, "4 z 6")
    c.showPage()
"""

target = "backend/app/pdf_generator.py"
with open(target, "r") as f:
    content = f.read()

start_idx = content.find("def draw_page_6(")
end_idx = content.find("def draw_page_7(", start_idx)

new_content = content[:start_idx] + new_func + "\n\n" + content[end_idx:]

with open(target, "w") as f:
    f.write(new_content)

print("Updated pdf_generator.py with fixed table, full background, and banner phone")
