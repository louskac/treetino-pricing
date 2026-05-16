import os

new_func = """def draw_page_7(c: canvas.Canvas, data: dict, assets_path: str):
    TEXT_COLOR = colors.white
    MUTED_COLOR = colors.HexColor("#94a3b8")
    ACCENT_COLOR = colors.HexColor("#38bdf8")
    CARD_BG = colors.Color(0.12, 0.16, 0.23, alpha=0.8)
    LINE_COLOR = colors.HexColor("#334155")
    
    # 1. Background
    import reportlab.lib.utils as utils
    from PIL import Image
    import io
    main_tree_path = os.path.join(assets_path, "products", "Still_Turbina.png")
    c.saveState()
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    
    if os.path.exists(main_tree_path):
        img_cover = utils.ImageReader(main_tree_path)
        c.drawImage(main_tree_path, 0, 0, width=W, height=H, preserveAspectRatio=False)
    
    # Heavy overlay
    c.setFillColor(colors.Color(0.06, 0.08, 0.12, alpha=0.92))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()
    
    # 2. HEADER
    c.setFont("Roboto-Bold", 8)
    c.setFillColor(ACCENT_COLOR)
    c.drawString(40, H - 40, "TECHNICKÁ SPECIFIKACE")
    
    c.setFont("Roboto-Bold", 28)
    c.setFillColor(TEXT_COLOR)
    c.drawString(40, H - 70, "TECHNOLOGIE & NORMY")
    
    c.setFont("Roboto", 9)
    c.setFillColor(MUTED_COLOR)
    c.drawString(40, H - 85, "Záruční podmínky a standardy kvality")
    
    # 3. MAIN CARD
    card_y = H - 560
    card_h = 440
    card_w = W - 80
    
    c.setFillColor(CARD_BG)
    c.roundRect(40, card_y, card_w, card_h, 6, fill=1, stroke=0)
    
    col1_x = 60
    col2_x = W / 2
    
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto-Bold", 11)
    c.drawString(col1_x, card_y + card_h - 30, "Technologie")
    c.drawString(col2_x, card_y + card_h - 30, "Soubory norem (je-li relevantní)")
    
    c.setStrokeColor(LINE_COLOR)
    c.line(40, card_y + card_h - 45, W - 40, card_y + card_h - 45)
    c.line(col2_x - 15, card_y + 20, col2_x - 15, card_y + card_h - 45)
    
    # Row 1: Fotovoltaické moduly
    y = card_y + card_h - 75
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(ACCENT_COLOR)
    c.drawString(col1_x, y, "Fotovoltaické moduly")
    
    t_obj = c.beginText(col2_x, y)
    t_obj.setFont("Roboto", 9)
    t_obj.setFillColor(TEXT_COLOR)
    t_obj.setLeading(14)
    t_obj.textLine("- splňují IEC 61215, IEC 61730")
    t_obj.textLine("  účinnost ≈ 21%")
    t_obj.textLine("")
    t_obj.textLine("- 25letá lineární záruka na výkon s max.")
    t_obj.textLine("  poklesem na 80 % původního výkonu")
    t_obj.textLine("  garantovanou výrobcem")
    t_obj.textLine("")
    t_obj.textLine("- 12letá produktová záruka garantovaná")
    t_obj.textLine("  výrobcem")
    c.drawText(t_obj)
    
    c.setStrokeColor(colors.Color(0.2, 0.25, 0.33, alpha=0.5))
    c.line(40, y - 110, W - 40, y - 110)
    
    # Row 2: Měniče
    y = y - 135
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(ACCENT_COLOR)
    c.drawString(col1_x, y, "Měniče")
    
    t_obj = c.beginText(col2_x, y)
    t_obj.setFont("Roboto", 9)
    t_obj.setFillColor(TEXT_COLOR)
    t_obj.setLeading(14)
    t_obj.textLine("- splňují IEC 61727 nebo IEC 62116 nebo")
    t_obj.textLine("  EN 50549-1/EN50549-2, shoda dle")
    t_obj.textLine("  EN 50549-1 rovněž garantováno")
    t_obj.textLine("  označením Tier 1")
    t_obj.textLine("")
    t_obj.textLine("- účinnost 98,0 % (Euro účinnost)")
    t_obj.textLine("")
    t_obj.textLine("- záruka výrobce či dodavatele trvající")
    t_obj.textLine("  10 let na jeho bezodkladnou výměnu či")
    t_obj.textLine("  adekvátní náhradu v případě poruchy")
    c.drawText(t_obj)
    
    c.line(40, y - 135, W - 40, y - 135)
    
    # Row 3: VTE
    y = y - 160
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(ACCENT_COLOR)
    c.drawString(col1_x, y, "VTE")
    
    t_obj = c.beginText(col2_x, y)
    t_obj.setFont("Roboto", 9)
    t_obj.setFillColor(TEXT_COLOR)
    t_obj.setLeading(14)
    t_obj.textLine("- záruka výrobce či dodavatele trvající")
    t_obj.textLine("  3 let na jeho bezodkladnou výměnu či")
    t_obj.textLine("  adekvátní náhradu v případě poruchy")
    c.drawText(t_obj)
    
    # 4. POZN BOX
    pozn_y = card_y - 150
    pozn_h = 130
    c.setFillColor(CARD_BG)
    c.roundRect(40, pozn_y, card_w, pozn_h, 6, fill=1, stroke=0)
    c.setFillColor(ACCENT_COLOR)
    c.roundRect(40, pozn_y, 4, pozn_h, 2, fill=1, stroke=0)
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(TEXT_COLOR)
    c.drawString(60, pozn_y + pozn_h - 25, "Pozn:")
    
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import Paragraph
    styles = getSampleStyleSheet()
    
    from reportlab.pdfbase.ttfonts import TTFont
    import sys
    from pathlib import Path
    fonts_path = str(Path(__file__).parent / "fonts")
    try:
        pdfmetrics.registerFont(TTFont("Roboto-Italic", os.path.join(fonts_path, "Roboto-Italic.ttf")))
        italic_font = "Roboto-Italic"
    except:
        italic_font = "Roboto"
        
    p_style = ParagraphStyle(
        "Notes",
        parent=styles["Normal"],
        fontName=italic_font,
        fontSize=8,
        leading=12,
        textColor=MUTED_COLOR
    )
    
    notes_text = (
        "Délka záruční doby Díla jako technologického celku bude uvedena ve Smlouvě. Po uplynutí "
        "záruční doby dle případného smluvního vztahu, pokud výrobce příslušného komponentu pou"
        "žitého Zhotovitelem k provedení Díla stanoví delší záruční dobu vůči třetím osobám – všem "
        "nabyvatelům příslušného komponentu, než je záruční doba uvedená v první větě, vznikají Ob"
        "jednateli nároky z titulu záručních vad v době po uplynutí záruční doby poskytnuté Zhotovite"
        "lem dle Smlouvy výlučně vůči výrobci, resp. jeho příslušnému zástupci pro Českou republiku.<br/>"
        "Záruční doba na jednotlivé komponenty Díla garantovaná výrobci bude specifikována ve "
        "Smlouvě."
    )
    
    p = Paragraph(notes_text, p_style)
    p_w, p_h = p.wrap(card_w - 40, H)
    p.drawOn(c, 60, pozn_y + pozn_h - 35 - p_h)
    
    # 5. FOOTER INFO
    f_y = pozn_y - 40
    
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(TEXT_COLOR)
    c.drawString(40, f_y, "Dodavatel:")
    
    c.setFont("Roboto", 8)
    c.setFillColor(MUTED_COLOR)
    c.drawString(100, f_y, "Firma: Treetino corp s.r.o.")
    c.drawString(40, f_y - 15, "IČ: 10800107 DIČ: CZ10800107 Sídlo: Český")
    c.drawString(40, f_y - 30, "Šternberk 9, 257 26 Český Šternberk")
    
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(ACCENT_COLOR)
    c.drawCentredString(W / 2, 70, "Termín dodání dle dohody, připravenosti stanoviště a materiálu.")
    
    # Page num
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "5 z 6")
    c.showPage()
"""

target = "backend/app/pdf_generator.py"
with open(target, "r") as f:
    content = f.read()

start_idx = content.find("def draw_page_7(")
end_idx = content.find("def draw_page_8(", start_idx)

new_content = content[:start_idx] + new_func + "\n\n" + content[end_idx:]

with open(target, "w") as f:
    f.write(new_content)

print("Updated pdf_generator.py with new draw_page_7")
