import os

new_func = """def draw_page_5(c: canvas.Canvas, data: dict, assets_path: str):
    result = data.get("result", {})
    annualYield = float(result.get("annualSolarKwh", 0)) + float(result.get("annualWindKwh", 0))
    vyroba_mwh = "{:.2f}".format(annualYield / 1000.0).replace(".", ",")
    
    # Fonts & Colors
    TEXT_COLOR = colors.white
    MUTED_COLOR = colors.HexColor("#94a3b8")
    ACCENT_COLOR = colors.HexColor("#38bdf8")
    CARD_BG = colors.Color(0.12, 0.16, 0.23, alpha=0.8) # Slate 800 with opacity
    LINE_COLOR = colors.HexColor("#334155")
    RED_COLOR = colors.HexColor("#f43f5e")
    GREEN_COLOR = colors.HexColor("#10b981")
    
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
    c.drawString(40, H - 40, "SIMULAČNÍ PROTOKOL")
    
    c.setFont("Roboto-Bold", 28)
    c.setFillColor(TEXT_COLOR)
    c.drawString(40, H - 70, "ZTRÁTY & PARAMETRY")
    
    c.setFont("Roboto", 9)
    c.setFillColor(MUTED_COLOR)
    c.drawString(40, H - 85, "Detailní technická specifikace | 2. 2. 2026")
    
    # 3. DIAGRAM ZTRÁT SYSTÉMU (Waterfall)
    card1_y = H - 540
    card1_h = 420
    card_w = W - 80
    
    c.setFillColor(CARD_BG)
    c.roundRect(40, card1_y, card_w, card1_h, 6, fill=1, stroke=0)
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(TEXT_COLOR)
    c.drawString(60, card1_y + card1_h - 25, "Diagram ztrát systému")
    
    c.setStrokeColor(LINE_COLOR)
    c.line(40, card1_y + card1_h - 40, W - 40, card1_y + card1_h - 40)
    
    items = [
        ("Globální záření na horizontální rovinu", "1,16 MWh/m²", "+1,78%", True, 1.0, 1.02),
        ("Globální záření na fotovoltaické panely", "", "", False, 0, 0),
        ("Ztráta osvitu zastíněním", "", "-4,88%", False, 1.02, -0.05),
        ("Ztráta odrazem", "", "-4,02%", False, 0.97, -0.04),
        ("Energie po FV konverzi", "158,38 MWh", "", True, 0.93, 0.93),
        ("Ztráta - intenzita záření", "", "-1,71%", False, 0.93, -0.02),
        ("Teplotní ztráta", "", "-0,58%", False, 0.91, -0.01),
        ("Elektrické ztráty zastíněním", "", "-3,67%", False, 0.90, -0.04),
        ("Ztráta - kvalita panelu", "", "+0,25%", False, 0.86, 0.01),
        ("Ztráta - účinnost optimizéru", "", "-0,97%", False, 0.87, -0.01),
        ("Ohmické ztráty na vedení DC", "", "-0,57%", False, 0.86, -0.01),
        ("Energie po DC ztrátách", "147,17 MWh", "", True, 0.85, 0.85),
        ("Ztráta - účinnost střídače", "", "-2,28%", False, 0.85, -0.02),
        ("Vyrobená energie", f"{vyroba_mwh} MWh", "", True, 0.83, 0.83)
    ]
    
    y_start = card1_y + card1_h - 65
    bar_x = 320
    max_bar_w = W - 40 - bar_x - 50 # 185
    
    for idx, (label, val, diff, is_main, start_f, len_f) in enumerate(items):
        y = y_start - (idx * 24)
        
        if is_main:
            c.setFont("Roboto-Bold", 9)
            c.setFillColor(ACCENT_COLOR)
            c.drawString(60, y, label)
            c.setFillColor(TEXT_COLOR)
            c.drawRightString(280, y, val)
            if diff:
                c.setFillColor(GREEN_COLOR)
                c.drawRightString(310, y, diff)
                
            # Draw main bar
            c.setFillColor(colors.HexColor("#1e293b"))
            c.roundRect(bar_x, y - 2, max_bar_w, 10, 3, fill=1, stroke=0)
            c.setFillColor(ACCENT_COLOR)
            c.roundRect(bar_x, y - 2, max_bar_w * len_f, 10, 3, fill=1, stroke=0)
            
        else:
            c.setFont("Roboto", 9)
            c.setFillColor(MUTED_COLOR)
            c.drawString(60, y, label)
            
            if diff:
                c.setFillColor(RED_COLOR if "-" in diff else GREEN_COLOR)
                c.drawRightString(310, y, diff)
                
                # Draw waterfall delta block
                base_x = bar_x + (max_bar_w * start_f)
                block_w = max_bar_w * abs(len_f)
                c.setFillColor(RED_COLOR if "-" in diff else GREEN_COLOR)
                c.roundRect(base_x - (block_w if "-" in diff else 0), y - 1, block_w, 8, 2, fill=1, stroke=0)
    
    # 4. PARAMETRY SIMULACE
    card2_y = card1_y - 190
    card2_h = 170
    
    c.setFillColor(CARD_BG)
    c.roundRect(40, card2_y, card_w, card2_h, 6, fill=1, stroke=0)
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(TEXT_COLOR)
    c.drawString(60, card2_y + card2_h - 25, "Parametry simulace")
    
    c.setStrokeColor(LINE_COLOR)
    c.line(40, card2_y + card2_h - 40, W - 40, card2_y + card2_h - 40)
    
    # Left Column
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(ACCENT_COLOR)
    c.drawString(60, card2_y + card2_h - 60, "POLOHA & SÍŤ")
    
    params_left = [
        ("Časové pásmo", "2. 2. 2026 SEČ (Prague)"),
        ("Meteorologická stanice", "Kostelní Myslová (25 km daleko)"),
        ("Nadmořská výška stanice", "569 m"),
        ("Zdroj dat stanice", "Meteonorm 8.2"),
        ("Síť", "400V L-L, 230V L-N")
    ]
    
    for idx, (label, val) in enumerate(params_left):
        y = card2_y + card2_h - 80 - (idx * 16)
        c.setFont("Roboto", 8)
        c.setFillColor(MUTED_COLOR)
        c.drawString(60, y, label)
        c.setFillColor(TEXT_COLOR)
        c.drawRightString(280, y, val)
        
    # Divider
    c.setStrokeColor(LINE_COLOR)
    c.line(W/2, card2_y + 20, W/2, card2_y + card2_h - 50)
    
    # Right Column
    t1_x = W / 2 + 20
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(ACCENT_COLOR)
    c.drawString(t1_x, card2_y + card2_h - 60, "FAKTORY ZTRÁT")
    
    params_right = [
        ("Blízké zastínění", "Povoleno"),
        ("Albedo", "0,20"),
        ("Bifaciální Albedo", "0,30"),
        ("Znečištění/Sníh", "0%"),
        ("Modifikátor úhlu dopadu (IAM)", "0,05"),
        ("Faktor tepelné ztráty Uc (const)", "20 (Zapuštěná montáž)"),
        ("Faktor tepelné ztráty Uc (const)", "29 (Montáž ve sklonu)")
    ]
    
    for idx, (label, val) in enumerate(params_right):
        y = card2_y + card2_h - 80 - (idx * 16)
        c.setFont("Roboto", 8)
        c.setFillColor(MUTED_COLOR)
        c.drawString(t1_x, y, label)
        c.setFillColor(TEXT_COLOR)
        c.drawRightString(W - 60, y, val)
        
    # 5. FOOTER
    c.setFillColor(MUTED_COLOR)
    c.setFont("Roboto", 9)
    sig_lines = [
        "Wattino",
        "Treetino corp s.r.o.",
        "(Wattino holding)",
        "IČ: 10800107",
        "DIČ: CZ10800107",
        "Český Šternberk 9, 257 26"
    ]
    for idx, s_line in enumerate(sig_lines):
        c.drawString(40, 80 - (idx * 11), s_line)

    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 25, "5 z 6")
    c.showPage()
"""

target = "backend/app/pdf_generator.py"
with open(target, "r") as f:
    content = f.read()

start_idx = content.find("def draw_page_5(")
end_idx = content.find("def draw_page_6(", start_idx)

new_content = content[:start_idx] + new_func + "\n\n" + content[end_idx:]

with open(target, "w") as f:
    f.write(new_content)

print("Updated pdf_generator.py with new draw_page_5")
