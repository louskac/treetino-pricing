import io
import os
import base64
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

# A4 dimensions: 595.27 points wide by 841.89 points high
W, H = A4

def draw_page_1(c: canvas.Canvas, data: dict, assets_path: str):
    import reportlab.lib.utils as utils
    
    # 1. Main Cover Image (strom1.png) + Dark Overlay
    main_tree_path = os.path.join(assets_path, "products", "strom1.png")
    
    # Fill background with dark color
    c.saveState()
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()
    
    if os.path.exists(main_tree_path):
        img_cover = utils.ImageReader(main_tree_path)
        img_w, img_h = img_cover.getSize()
        
        # Fit tree in the lower/middle section
        target_w = W * 1.2
        target_h = (target_w / float(img_w)) * img_h
        x_pos = (W - target_w) / 2.0
        y_pos = (H - target_h) / 2.0 - 50
        
        c.drawImage(main_tree_path, x_pos, y_pos, width=target_w, height=target_h, mask='auto')
        
    # Dark slate overlay to make text pop and match other pages
    c.saveState()
    c.setFillColor(colors.Color(0.06, 0.08, 0.12, alpha=0.75))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()
        
    # Extract data
    location = data.get("location", {})
    pins = location.get("pins", [])
    unit_count = len(pins) if pins else 1
    client_name = data.get("clientName", "M - KOVO").upper()
    
    # User explicitly requested 49 kWp for V1 tree
    per_tree_power = 49

    # 2. Top Logo and Text
    logo_path = os.path.join(assets_path, "branding", "logo_horizontal.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(assets_path, "branding", "logo.png")
        
    if os.path.exists(logo_path):
        img_logo = utils.ImageReader(logo_path)
        lw, lh = img_logo.getSize()
        scale_l = min(350.0 / float(lw), 70.0 / float(lh))
        fin_lw = lw * scale_l
        fin_lh = lh * scale_l
        c.drawImage(logo_path, (W - fin_lw) / 2.0, H - 120, width=fin_lw, height=fin_lh, mask='auto')
    
    c.setFont("Roboto-Bold", 22)
    c.setFillColor(colors.white)
    
    if unit_count > 1:
        top_text = f"Soustava s Výkonem {per_tree_power * unit_count} kW"
    else:
        top_text = f"Strom s Výkonem {per_tree_power} kW"
        
    c.drawCentredString(W / 2.0, H - 170, top_text)
    

    
    # 4. Text inside the overlay
    c.setFillColor(colors.white)
    c.setFont("Roboto-Bold", 20)
    
    line1 = "Cenová nabídka alternativního hybridního řešení o"
    line2 = f"výkonu ({unit_count}x strom x {per_tree_power} kWp)"
    
    c.drawCentredString(W / 2.0, 180, line1)
    c.drawCentredString(W / 2.0, 150, line2)
    
    # Wrap client name if it's too long
    max_w = W - 100
    font_size = 32
    font_name = "Roboto-Bold"
    from reportlab.lib.utils import simpleSplit
    lines = simpleSplit(client_name, font_name, font_size, max_w)
    while font_size > 16 and len(lines) > 2:
        font_size -= 2
        lines = simpleSplit(client_name, font_name, font_size, max_w)
        
    pro_y = 50 + (len(lines) * font_size * 1.2) + 10
    
    c.setFont("Roboto-Bold", 24)
    c.drawCentredString(W / 2.0, pro_y, "Pro")
        
    c.setFont(font_name, font_size)
    y_pos = pro_y - 40
    for ln in lines:
        c.drawCentredString(W / 2.0, y_pos, ln)
        y_pos -= font_size * 1.2
    
    c.showPage()


def draw_page_2(c: canvas.Canvas, data: dict, assets_path: str):
    from reportlab.lib.utils import simpleSplit
    import os
    import math
    from reportlab.lib import colors
    import reportlab.lib.utils as utils

    # 1. Dark Background with subtle tree overlay
    c.saveState()
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    
    main_tree_path = os.path.join(assets_path, "products", "strom3.png")
    if os.path.exists(main_tree_path):
        img_cover = utils.ImageReader(main_tree_path)
        img_w, img_h = img_cover.getSize()
        
        target_w = W * 1.5
        target_h = (target_w / float(img_w)) * img_h
        x_pos = (W - target_w) / 2.0
        y_pos = (H - target_h) / 2.0
        
        c.drawImage(main_tree_path, x_pos, y_pos, width=target_w, height=target_h, mask='auto')
        
    # Dark overlay to make text pop
    c.setFillColor(colors.HexColor("#000000"))
    c.setFillAlpha(0.85)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()

    # 2. Top Logo (White)
    logo_path = os.path.join(assets_path, "branding", "logo_horizontal.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(assets_path, "branding", "logo.png")
        
    if os.path.exists(logo_path):
        img_logo = utils.ImageReader(logo_path)
        lw, lh = img_logo.getSize()
        scale_l = min(200.0 / float(lw), 40.0 / float(lh))
        fin_lw = lw * scale_l
        fin_lh = lh * scale_l
        c.drawImage(logo_path, 40, H - 60 - fin_lh/2.0, width=fin_lw, height=fin_lh, mask='auto')

    # 3. Headers
    y_pos = H - 120
    c.setFont("Roboto-Bold", 18)
    c.setFillColor(colors.white)
    c.drawCentredString(W / 2.0, y_pos, "Řešení které Vám nabízíme")
    
    y_pos -= 30
    sub_text = (
        "Treetino – technologicky nejpokročilejší autonomní elektrárnu na "
        "trhu, která kombinuje solární a větrnou energii v designu "
        "technologického stromu. Představuje přímou odpověď na rostoucí "
        "ceny energií a zpřísňující se ESG legislativu."
    )
    c.setFont("Roboto-Bold", 12)
    lines = simpleSplit(sub_text, "Roboto-Bold", 12, W - 100)
    for line in lines:
        c.drawCentredString(W / 2.0, y_pos, line)
        y_pos -= 18

    y_pos -= 20
    c.setFont("Roboto-Bold", 16)
    c.setFillColor(colors.HexColor("#00b4d8"))
    c.drawCentredString(W / 2.0, y_pos, "4 klíčové schopnosti naší technologie")
    
    y_pos -= 40

    # 4. Content Blocks
    blocks = [
        {
            "title": "1) Extrémní prostorová efektivita (Úspora plochy)",
            "text": "Realita: Klasická fotovoltaika vyžaduje rozsáhlé střechy nebo pozemky.\nŘešení Treetino: Zabere pouhý 1 m² na zemi, ale díky 3D architektuře koruny nahradí až 400 m² běžných solárních panelů. Má výkon až 49 kW (ideální pro napájení budov nebo firemního fleetu / EV nabíječek)."
        },
        {
            "title": "2) Energetická stabilita 24/7 (Slunce + Vítr)",
            "text": "Eliminujeme hlavní nevýhodu běžného soláru. Treetino kombinuje chytré solární listy s integrovanými tichými větrnými turbínami. Energii pro vaši firmu vyrábí ve dne, v noci, v zimě i při zhoršeném počasí."
        },
        {
            "title": "3) Ochrana investice a AI optimalizace (Vyšší ROI)",
            "text": "Vestavěná umělá inteligence (AI) aktivně natáčí listy za sluncem, což zvyšuje energetický výnos o 30 % oproti statickým systémům. V případě blížící se bouře nebo krupobití AI otočí automaticky FVE listy k zemi, čímž předchází škodám na majetku."
        },
        {
            "title": "4) Hmatatelný důkaz vaší ESG strategie a PR (Reputační hodnota)",
            "text": "Na rozdíl od panelů schovaných na střeše je Treetino umístěné před vaší centrálou nebo na firemním parkovišti. Je to nepřehlédnutelný vizuální symbol, který klientům, investorům i auditorům okamžitě demonstruje, že vaše firma je lídrem v inovacích a udržitelnosti."
        }
    ]
    
    content_width = W * 0.62
    rx = W - 90
    for i, b in enumerate(blocks):
        block_start_y = y_pos
        c.setFont("Roboto-Bold", 12)
        c.setFillColor(colors.white)
        c.drawString(40, y_pos, b["title"])
        y_pos -= 18
        
        c.setFont("Roboto", 10)
        c.setFillColor(colors.HexColor("#e2e8f0"))
        
        for paragraph in b["text"].split("\n"):
            plines = simpleSplit(paragraph, "Roboto", 10, content_width)
            for pln in plines:
                c.drawString(40, y_pos, pln)
                y_pos -= 14
                
        block_end_y = y_pos
        block_center_y = (block_start_y + block_end_y) / 2.0
        
        # Dynamic Icons Alignment
        icon_size = 40
        if i == 0:
            c.setFont("Roboto-Bold", 26)
            c.setFillColor(colors.white)
            c.drawCentredString(rx, block_center_y + 10, "49 kW")
            c.drawCentredString(rx, block_center_y - 20, "1m²")
            
        elif i == 1:
            sun_path = os.path.join(assets_path, "icons", "sun.png")
            wind_path = os.path.join(assets_path, "icons", "wind.png")
            if os.path.exists(sun_path) and os.path.exists(wind_path):
                c.drawImage(sun_path, rx - icon_size/2.0, block_center_y, width=icon_size, height=icon_size, mask='auto')
                c.drawImage(wind_path, rx - icon_size/2.0, block_center_y - icon_size + 10, width=icon_size, height=icon_size, mask='auto')
            
        elif i == 2:
            cpu_path = os.path.join(assets_path, "icons", "cpu.png")
            if os.path.exists(cpu_path):
                c.drawImage(cpu_path, rx - (icon_size+10)/2.0, block_center_y - (icon_size+10)/2.0, width=icon_size+10, height=icon_size+10, mask='auto')
                c.setFont("Roboto-Bold", 14)
                c.setFillColor(colors.white)
                c.drawCentredString(rx, block_center_y - 4, "AI")
                
        elif i == 3:
            leaf_path = os.path.join(assets_path, "icons", "leaf.png")
            if os.path.exists(leaf_path):
                c.drawImage(leaf_path, rx - (icon_size+10)/2.0, block_center_y - (icon_size+10)/2.0, width=icon_size+10, height=icon_size+10, mask='auto')

        y_pos -= 30

    # Footer
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawString(40, 50, "Treetino corp s.r.o.")
    c.drawString(40, 40, "IČ: 10800107")
    c.drawString(40, 30, "DIČ: CZ10800107")
    c.drawString(40, 20, "Vlčetin 62, Bílá 463 43")
    
    c.drawCentredString(W / 2, 30, "2 z 8")
    
    c.showPage()


def draw_page_3(c: canvas.Canvas, data: dict, assets_path: str):
    import requests
    import io
    import math
    from PIL import Image
    import reportlab.lib.utils as utils
    import os
    
    # 1. Background
    main_tree_path = os.path.join(assets_path, "products", "strom2.png")
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
        c.drawImage(main_tree_path, offset_x, offset_y, width=draw_w, height=draw_h, preserveAspectRatio=True)
    
    # Heavier overlay for dashboard feel
    c.setFillColor(colors.Color(0.06, 0.08, 0.12, alpha=0.92))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()
    
    # 2. Headers
    logo_path = os.path.join(assets_path, "branding", "logo_horizontal.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(assets_path, "branding", "logo.png")
        
    if os.path.exists(logo_path):
        img_logo = utils.ImageReader(logo_path)
        lw, lh = img_logo.getSize()
        scale_l = min(150.0 / float(lw), 40.0 / float(lh))
        fin_lw = lw * scale_l
        fin_lh = lh * scale_l
        c.drawImage(logo_path, 40, H - 60 - fin_lh/2.0, width=fin_lw, height=fin_lh, mask='auto')

    c.setFont("Roboto-Bold", 9)
    c.setFillColor(colors.HexColor("#38bdf8")) # Accent blue
    c.drawString(40, H - 100, "TECHNICKÁ ANALÝZA VÝKONU")
    
    c.setFont("Roboto-Bold", 24)
    c.setFillColor(colors.white)
    c.drawString(40, H - 130, "Simulace a návratnost pro")
    c.setFillColor(colors.HexColor("#38bdf8"))
    client_name = data.get("clientName", "NÁZEV FIRMY")
    c.drawString(40 + c.stringWidth("Simulace a návratnost pro ", "Roboto-Bold", 24), H - 130, str(client_name))
    
    c.setFont("Roboto", 10)
    c.setFillColor(colors.HexColor("#94a3b8"))
    desc = "Pokročilá autonomní elektrárna kombinující solární a větrnou energii."
    desc2 = "Přímá odpověď na rostoucí ceny energií a zpřísňující se ESG legislativu."
    c.drawString(40, H - 150, desc)
    c.drawString(40, H - 165, desc2)
    
    card_bg = colors.Color(0.12, 0.16, 0.23, alpha=0.8) # Slate 800 with opacity
    card_radius = 8
    
    # 3. Map Card
    map_w = 230
    map_h = 240
    map_x = 40
    map_y = H - 430
    
    c.setFillColor(card_bg)
    c.roundRect(map_x, map_y, map_w, map_h, card_radius, fill=1, stroke=0)
    
    try:
        location = data.get("location", {})
        pins = location.get("pins", [])
        if not pins and location.get("lat"):
            pins = [{"lat": location["lat"], "lng": location["lon"]}]
            
        sw, sh = 500, 500
        if pins:
            center_lat = sum(p["lat"] for p in pins) / len(pins)
            center_lon = sum(p["lng"] for p in pins) / len(pins)
            zoom = 18.0
        else:
            center_lat, center_lon = 50.088, 14.42
            zoom = 18.0
        
        token = data.get("mapboxToken", "")
        if not token:
            token = os.environ.get("VITE_MAPBOX_TOKEN", "")
            if not token:
                env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
                if os.path.exists(env_path):
                    with open(env_path, "r") as f:
                        for line in f:
                            if line.startswith("VITE_MAPBOX_TOKEN="):
                                token = line.split("=", 1)[1].strip()
                                break
            
        url = f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/{center_lon},{center_lat},{zoom},0/{sw}x{sh}@2x?access_token={token}"
        resp = requests.get(url, timeout=10)
        img = Image.open(io.BytesIO(resp.content)).convert("RGBA")
        
        # Add pins
        map_image_path = os.path.join(assets_path, "products", "top_view.png")
        if not os.path.exists(map_image_path): map_image_path = os.path.join(assets_path, "top_view.png")
        if os.path.exists(map_image_path):
            img_w, img_h = img.size
            physical_tile_size = 256 * (img_w / sw)
            
            # Trees are 17 meters wide
            meters_per_pixel = (40075016.686 * math.cos(math.radians(center_lat))) / (physical_tile_size * (2 ** zoom))
            pixels_per_meter = 1 / meters_per_pixel if meters_per_pixel > 0 else 1
            tree_size = max(10, int(17 * pixels_per_meter))
            
            tree_icon = Image.open(map_image_path).convert("RGBA")
            tree_icon = tree_icon.resize((tree_size, tree_size), Image.Resampling.LANCZOS)
            
            def latlon_to_pixels(lon, lat, z):
                n = 2.0 ** z
                x = (lon + 180.0) / 360.0 * n * physical_tile_size
                y = (1.0 - math.log(math.tan(math.radians(lat)) + (1.0 / math.cos(math.radians(lat)))) / math.pi) / 2.0 * n * physical_tile_size
                return x, y
                
            mcx, mcy = latlon_to_pixels(center_lon, center_lat, zoom)
            from PIL import ImageDraw
            draw = ImageDraw.Draw(img)
            for p in pins:
                px, py = latlon_to_pixels(p["lng"], p["lat"], zoom)
                ix = int(img_w / 2 + (px - mcx)) - tree_size // 2
                iy = int(img_h / 2 + (py - mcy)) - tree_size // 2
                draw.ellipse([ix - 4, iy - 4, ix + tree_size + 4, iy + tree_size + 4], outline="#38bdf8", width=4)
                img.paste(tree_icon, (ix, iy), tree_icon)
        
        final_io = io.BytesIO()
        img.convert("RGB").save(final_io, format="JPEG", quality=90)
        final_io.seek(0)
        
        c.saveState()
        path = c.beginPath()
        path.roundRect(map_x, map_y, map_w, map_h, card_radius)
        c.clipPath(path, stroke=0, fill=0)
        c.drawImage(utils.ImageReader(final_io), map_x, map_y, width=map_w, height=map_h, preserveAspectRatio=False)
        c.restoreState()
    except Exception as e:
        print("Map error:", e)

    # DATA
    result = data.get("result", {})
    annualYield = (result.get("annualSolarKwh", 0) + result.get("annualWindKwh", 0))
    spotreba_amount = data.get("consumptionOverride")
    if spotreba_amount is None:
        spotreba_amount = result.get("buildingConsumption", 360.0)
    monthly = result.get("monthlyData", [])
    
    # 4. Production Graph Card
    prod_x = 290
    prod_y = H - 430
    prod_w = W - 330
    prod_h = 240
    
    c.setFillColor(card_bg)
    c.roundRect(prod_x, prod_y, prod_w, prod_h, card_radius, fill=1, stroke=0)
    
    c.setFont("Roboto-Bold", 12)
    c.setFillColor(colors.white)
    c.drawString(prod_x + 20, prod_y + prod_h - 25, "Odhadovaná energie za měsíc")
    
    c.setFont("Roboto", 7)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawRightString(prod_x + prod_w - 20, prod_y + prod_h - 25, "MWh / Měsíc")
    
    # Chart logic
    chart_x = prod_x + 20
    chart_w = prod_w - 40
    chart_y = prod_y + 30
    chart_h = prod_h - 75
    
    max_val_mwh = 0
    for m in monthly:
        s = m.get("solar", 0)/1000.0
        w = m.get("wind", 0)/1000.0
        cons = spotreba_amount / 12.0
        if (s+w) > max_val_mwh: max_val_mwh = s+w
        if cons > max_val_mwh: max_val_mwh = cons
    if max_val_mwh <= 0: max_val_mwh = 1
    max_val_rounded = int(math.ceil(max_val_mwh / 5.0) * 5)
    if max_val_rounded == 0: max_val_rounded = 5
    
    group_w = chart_w / 12.0
    bar_w = 12 
    
    for i, m in enumerate(monthly):
        s_mwh = m.get("solar", 0)/1000.0
        w_mwh = m.get("wind", 0)/1000.0
        cons_mwh = spotreba_amount / 12.0
        prod_total = s_mwh + w_mwh
        
        prod_h_px = (prod_total / max_val_rounded) * chart_h
        cons_h_px = (cons_mwh / max_val_rounded) * chart_h
        
        bx = chart_x + i * group_w + (group_w - bar_w) / 2.0
        
        # Consumption background bar (Grid used)
        c.setFillColor(colors.HexColor("#334155"))
        c.roundRect(bx, chart_y, bar_w, cons_h_px, 2, fill=1, stroke=0)
        
        # Production foreground bar (Cyan)
        c.setFillColor(colors.HexColor("#0ea5e9")) # Bright cyan/blue
        c.roundRect(bx, chart_y, bar_w, prod_h_px, 2, fill=1, stroke=0)
        
        # X Axis labels
        c.setFillColor(colors.HexColor("#94a3b8"))
        c.setFont("Roboto-Bold", 6)
        months = ["LED", "ÚNO", "BŘE", "DUB", "KVĚ", "ČVN", "ČVC", "SRP", "ZÁŘ", "ŘÍJ", "LIS", "PRO"]
        if i % 3 == 0:
            if i < len(months):
                c.drawCentredString(bx + bar_w/2, chart_y - 10, months[i])

    # 5. System Loss Diagram Card
    loss_x = 40
    loss_y = H - 760
    loss_w = W - 80
    loss_h = 310
    
    c.setFillColor(card_bg)
    c.roundRect(loss_x, loss_y, loss_w, loss_h, card_radius, fill=1, stroke=0)
    
    c.setFont("Roboto-Bold", 12)
    c.setFillColor(colors.white)
    c.drawString(loss_x + 20, loss_y + loss_h - 25, "Diagram ztrát systému")
    
    c.setStrokeColor(colors.HexColor("#334155"))
    c.line(loss_x + 20, loss_y + loss_h - 35, loss_x + loss_w - 20, loss_y + loss_h - 35)
    
    vyroba_mwh_str = "{:.2f}".format(annualYield / 1000.0).replace(".", ",")
    items = [
        ("Globální záření na horizontální rovinu", "1,16 MWh/m²", 100, "+1.78%", True),
        ("Ztráta osvitu zastíněním", "-4,88%", 95, None, False),
        ("Energie po FV konverzi", "158,38 MWh", 95, None, True),
        ("Elektrické ztráty zastíněním", "-3,67%", 91, None, False),
        ("Ohmické ztráty na vedení DC", "-0,57%", 91, None, False),
        ("Ztráta - účinnost střídače", "-2,28%", 89, None, False),
        ("Vyrobená energie celkem", f"{vyroba_mwh_str} MWh", 89, None, True)
    ]
    
    start_y = loss_y + loss_h - 65
    row_h = 34
    bar_track_h = 6
    
    for i, (label, val, pct, extra, is_main) in enumerate(items):
        cy = start_y - i * row_h
        
        c.setFont("Roboto-Bold" if is_main else "Roboto", 8)
        c.setFillColor(colors.white if is_main else colors.HexColor("#94a3b8"))
        c.drawString(loss_x + 20, cy, label)
        
        c.setFont("Roboto-Bold" if is_main else "Roboto", 8)
        c.setFillColor(colors.HexColor("#38bdf8") if is_main else colors.HexColor("#fda4af"))
        c.drawRightString(loss_x + loss_w - 20, cy, val)
        
        if is_main:
            c.setFillColor(colors.HexColor("#0f172a"))
            c.roundRect(loss_x + 20, cy - 10, loss_w - 40, bar_track_h, 3, fill=1, stroke=0)
            fill_w = (loss_w - 40) * (pct / 100.0)
            c.setFillColor(colors.HexColor("#38bdf8"))
            c.roundRect(loss_x + 20, cy - 10, fill_w, bar_track_h, 3, fill=1, stroke=0)
        else:
            c.setFillColor(colors.HexColor("#fda4af"))
            c.roundRect(loss_x + loss_w - 40, cy - 10, 20, bar_track_h, 3, fill=1, stroke=0)
            
    c.setStrokeColor(colors.HexColor("#334155"))
    c.line(loss_x + 20, loss_y + 35, loss_x + loss_w - 20, loss_y + 35)
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(colors.white)
    c.drawString(loss_x + 20, loss_y + 15, "Vyrobená energie celkem")
    c.setFillColor(colors.HexColor("#38bdf8"))
    c.drawRightString(loss_x + loss_w - 20, loss_y + 15, f"{vyroba_mwh_str} MWh")

    # 6. Meteorological Station info
    location = data.get("location", {})
    lat = location.get("lat", 0)
    lon = location.get("lon", 0)
    station_text = f"Satelitní grid lokalita: {lat:.4f}°N, {lon:.4f}°E, Zdroj: PVGIS & Open-Meteo"
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawCentredString(W/2, 60, station_text)

    # Footer
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(40, 50, "Treetino corp s.r.o.")
    c.drawString(40, 40, "IČ: 10800107")
    c.drawString(40, 30, "DIČ: CZ10800107")
    c.drawString(40, 20, "Vlčetin 62, Bílá 463 43")
    
    c.drawCentredString(W / 2, 30, "3 z 6")
    c.showPage()


def draw_page_4(c: canvas.Canvas, data: dict, assets_path: str):
    result = data.get("result", {})
    annualYield = (result.get("annualSolarKwh", 0) + result.get("annualWindKwh", 0))

    consumption_override = data.get("consumptionOverride", None)
    if consumption_override is not None:
        spotreba_amount = consumption_override
    else:
        spotreba_amount = result.get("buildingConsumption", 360.0)

    monthly = result.get("monthlyData", [])
    total_consumed_from_solar = 0
    total_production = 0
    
    for m in monthly:
        sol_mwh = m.get("solar", 0) / 1000.0
        wind_mwh = m.get("wind", 0) / 1000.0
        cons_mwh = spotreba_amount / 12.0
        
        prod_mwh = sol_mwh + wind_mwh
        total_production += prod_mwh
        
        local_used = min(prod_mwh, cons_mwh)
        total_consumed_from_solar += local_used

    vyroba_mwh = "{:.2f}".format(total_production).replace(".", ",")
    spotreba_mwh = "{:.2f}".format(spotreba_amount).replace(".", ",")
    
    do_budovy_val = total_consumed_from_solar
    do_site_val = total_production - total_consumed_from_solar
    
    z_sol_val = total_consumed_from_solar
    z_site_val = spotreba_amount - total_consumed_from_solar
    
    do_budovy = "{:.2f}".format(do_budovy_val).replace(".", ",")
    do_site = "{:.2f}".format(do_site_val).replace(".", ",")
    
    z_sol_mwh = "{:.2f}".format(z_sol_val).replace(".", ",")
    z_site_mwh = "{:.2f}".format(z_site_val).replace(".", ",")

    vyroba_pct = int((do_budovy_val / total_production * 100)) if total_production > 0 else 0
    spotreba_pct = int((z_sol_val / spotreba_amount * 100)) if spotreba_amount > 0 else 0
    
    # ------------------ 2. MONTHLY BAR CHART ------------------ #
    c.setFont("Roboto-Bold", 16) 
    c.setFillColor(colors.black)
    c.drawString(40, H - 50, "ODHADOVANÁ ENERGIE ZA MĚSÍC")
    
    max_val_mwh = 0
    for m in monthly:
        s = m.get("solar", 0)/1000.0
        w = m.get("wind", 0)/1000.0
        cmp_spotreba = spotreba_amount / 12.0
        if (s+w) > max_val_mwh: max_val_mwh = s+w
        if cmp_spotreba > max_val_mwh: max_val_mwh = cmp_spotreba
        
    if max_val_mwh <= 0: max_val_mwh = 1
    
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.setLineWidth(0.5)
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    
    import math
    max_val_rounded = int(math.ceil(max_val_mwh / 5.0) * 5)
    if max_val_rounded == 0: max_val_rounded = 5
    
    chart_h = 300
    chart_y = H - 420
    grid_lines = 7
    
    # Draw horizontal grid & labels
    for j in range(grid_lines + 1):
        y_pos = chart_y + j * (chart_h / float(grid_lines))
        c.line(70, y_pos, W - 200, y_pos) 
        
        label_val = int(round(j * (max_val_rounded / float(grid_lines))))
        c.drawRightString(60, y_pos - 3, f"{label_val} MWh")
    
    group_w = (W - 270) / 12.0
    bar_w = 10 
    pair_gap = 2
    
    for i, m in enumerate(monthly):
        s_mwh = m.get("solar", 0)/1000.0
        w_mwh = m.get("wind", 0)/1000.0
        cons_mwh = spotreba_amount / 12.0
        
        prod_total = s_mwh + w_mwh
        prod_s_h = (s_mwh / max_val_rounded) * chart_h
        prod_w_h = (w_mwh / max_val_rounded) * chart_h
        
        local_used = min(prod_total, cons_mwh)
        grid_used = cons_mwh - local_used
        cons_blue_h = (local_used / max_val_rounded) * chart_h
        cons_orng_h = (grid_used / max_val_rounded) * chart_h
        
        # Proper spacing math: total width utilized is bar_w + pair_gap + bar_w = 22.
        # Leaves group_w - 22 = 5px gap between months!
        x_left = 70 + i * group_w + (group_w - (bar_w * 2 + pair_gap)) / 2.0
        x_right = x_left + bar_w + pair_gap
        
        # Solar (Light Green) at bottom, Wind (Dark Green) stacked on top
        c.setFillColor(colors.HexColor("#6ee7b7"))
        c.rect(x_left, chart_y, bar_w, prod_s_h, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#10b981"))
        c.rect(x_left, chart_y + prod_s_h, bar_w, prod_w_h, fill=1, stroke=0)
        
        # Ze solaru (Blue) at bottom, From Grid (Orange) stacked on top
        c.setFillColor(colors.HexColor("#60a5fa"))
        c.rect(x_right, chart_y, bar_w, cons_blue_h, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#fbbf24"))
        c.rect(x_right, chart_y + cons_blue_h, bar_w, cons_orng_h, fill=1, stroke=0)
        
        c.setFillColor(colors.black)
        c.setFont("Roboto-Bold", 8)
        if i % 3 == 0:
            c.drawCentredString(x_left + bar_w + (pair_gap/2), chart_y - 15, str(m.get("month", "")))
            
    leg_x = W - 180
    leg_y = chart_y + chart_h - 40
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(colors.HexColor("#1e293b"))
    c.drawString(leg_x, leg_y, "Výroba")
    
    # 1. Dark Green - VTE (Turbine icon vector)
    c.setFillColor(colors.HexColor("#10b981"))
    c.circle(leg_x + 5, leg_y - 18, 3, fill=1, stroke=0)
    # Draw simple turbine
    bx, by = leg_x + 18, leg_y - 18
    c.setStrokeColor(colors.HexColor("#334155"))
    c.setLineWidth(1)
    c.line(bx, by-4, bx, by+2) # pole
    c.line(bx, by+2, bx-3, by+5) # left blade
    c.line(bx, by+2, bx+3, by+5) # right blade
    c.line(bx, by+2, bx, by-2) # down blade element
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Roboto", 8)
    c.drawString(leg_x + 28, leg_y - 21, "VTE")
    
    # 2. Light Green - Do budovy (House icon vector)
    c.setFillColor(colors.HexColor("#6ee7b7"))
    c.circle(leg_x + 5, leg_y - 38, 3, fill=1, stroke=0)
    bx, by = leg_x + 18, leg_y - 38
    c.setStrokeColor(colors.HexColor("#334155"))
    c.rect(bx-4, by-4, 8, 5, stroke=1, fill=0) # house base
    c.line(bx-5, by+1, bx, by+5) # roof left
    c.line(bx, by+5, bx+5, by+1) # roof right
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(leg_x + 28, leg_y - 41, "Do budovy")
    
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.line(leg_x, leg_y - 55, W - 40, leg_y - 55)
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(colors.HexColor("#1e293b"))
    c.drawString(leg_x, leg_y - 75, "Spotřeba")
    
    # 3. Orange - From Grid (Pylon icon vector)
    c.setFillColor(colors.HexColor("#fbbf24"))
    c.circle(leg_x + 5, leg_y - 93, 3, fill=1, stroke=0)
    bx, by = leg_x + 18, leg_y - 93
    c.setStrokeColor(colors.HexColor("#334155"))
    c.line(bx-2, by-4, bx, by+4) # left strut
    c.line(bx+2, by-4, bx, by+4) # right strut
    c.line(bx-4, by+1, bx+4, by+1) # crossbar 1
    c.line(bx-3, by-1, bx+3, by-1) # crossbar 2
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Roboto", 8)
    c.drawString(leg_x + 28, leg_y - 96, "Ze sítě")
    
    # 4. Blue - Ze solaru (Solar panel vector)
    c.setFillColor(colors.HexColor("#60a5fa"))
    c.circle(leg_x + 5, leg_y - 113, 3, fill=1, stroke=0)
    bx, by = leg_x + 18, leg_y - 113
    c.setStrokeColor(colors.HexColor("#334155"))
    c.rect(bx-4, by-3, 8, 6, stroke=1, fill=0) # panel box
    c.line(bx, by-3, bx, by+3) # middle split
    c.line(bx+1, by-3, bx+2, by+3)
    c.line(bx-4, by, bx+4, by) # cross split
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(leg_x + 28, leg_y - 116, "Ze solárů")

    # Company Signature block
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Roboto", 8)
    sig_lines = [
        "Wattino",
        "Treetino corp s.r.o.",
        "IČ: 10800107",
        "DIČ:CZ10800107",
        "Český Šternberk 9, 257 26"
    ]
    for idx, s_line in enumerate(sig_lines):
        c.drawString(40, 80 - (idx * 12), s_line)

    # Page num
    c.setFillColor(colors.black)
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "4 z 8")
    c.showPage()
    

def draw_page_5(c: canvas.Canvas, data: dict, assets_path: str):
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
    
    location = data.get("location", {})
    lat = location.get("lat", 0)
    lon = location.get("lon", 0)
    from datetime import datetime
    today_str = datetime.now().strftime("%d. %m. %Y")
    
    params_left = [
        ("Datum simulace", f"{today_str} (SEČ)"),
        ("Meteorologická stanice", f"Grid {lat:.4f}°N, {lon:.4f}°E"),
        ("Nadmořská výška stanice", "Dle digitálního modelu terénu"),
        ("Zdroj dat", "PVGIS SARAH2 & Open-Meteo ERA5"),
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


def draw_page_6(c: canvas.Canvas, data: dict, assets_path: str):
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
    
    location = data.get("location", {})
    pins = location.get("pins", [])
    units_qty = len(pins) if pins else 1
    unit_price = total_before_discount / units_qty
    client_name = data.get("clientName", "M - KOVO s.r.o.")
    client_address = data.get("clientAddress", "Nezadáno")
    ico_val = data.get("ico", "") or "Nezadáno"
    dic_val = data.get("dic", "") or "Nezadáno"

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
    
    import base64
    client_logo_b64 = data.get("clientLogoBase64")
    if client_logo_b64:
        try:
            b64_data = client_logo_b64.split(",", 1)[1] if "," in client_logo_b64 else client_logo_b64
            img_data = base64.b64decode(b64_data)
            img_reader = utils.ImageReader(io.BytesIO(img_data))
            
            max_w, max_h = 100, 50
            iw, ih = img_reader.getSize()
            scale = min(max_w / float(iw), max_h / float(ih))
            w, h = iw * scale, ih * scale
            
            c.drawImage(img_reader, W - 40 - w, H - 40 - h + 8, width=w, height=h, mask='auto')
        except Exception as e:
            print("Failed to draw client logo:", e)
    
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
    
    # Simple split for address if it's too long
    from reportlab.lib.utils import simpleSplit
    addr_lines = simpleSplit(client_address, "Roboto", 9, card_w - 20)
    ay = card_y + card_h - 55
    for al in addr_lines[:2]:
        c.drawString(col3, ay, al)
        ay -= 15
    
    c.setFont("Roboto-Bold", 8)
    c.drawString(col3, card_y + 20, "IČO")
    c.drawString(col4, card_y + 20, "DIČ")
    c.setFillColor(TEXT_COLOR)
    c.drawString(col3, card_y + 8, str(ico_val))
    c.drawString(col4, card_y + 8, str(dic_val))
    
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
    
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(colors.HexColor("#10b981"))
    discount_msg = f"Aplikována celková sleva: {format_czk(discount_amount)}"
    c.drawRightString(right_card_x + card_w, bottom_y - 12, discount_msg)
    
    # 6. BANNER SECTION (FULL WIDTH BLACK BOTTOM)
    c.setFillColor(colors.HexColor("#060b13"))
    c.rect(0, 0, W, 220, fill=1, stroke=0)
    
    c.setFont("Roboto-Bold", 18)
    c.setFillColor(TEXT_COLOR)
    c.drawString(40, 175, "Premiová konektivita")
    c.drawString(40, 153, "Na 3 měsíce ")
    c.setFillColor(ACCENT_COLOR)
    c.drawString(40 + c.stringWidth("Na 3 měsíce ", "Roboto-Bold", 18), 153, "Zdarma")
    
    c.setFont("Roboto", 9)
    c.setFillColor(TEXT_COLOR)
    bullets = [
        "AI systém optimalizace výroby",
        "Reakce na meteorologická data",
        "Světelná Show",
        "Možnosti sdílení"
    ]
    for idx, b in enumerate(bullets):
        by = 180 - (idx * 20)
        c.circle(230, by + 3, 2, fill=1, stroke=0)
        c.drawString(240, by, b)
        
    btn_y = 110
    c.setStrokeColor(TEXT_COLOR)
    c.roundRect(40, btn_y, 100, 25, 4, fill=0, stroke=1)
    c.setFont("Roboto-Bold", 8)
    c.drawCentredString(90, btn_y + 9, "Stáhnout aplikaci")
    
    c.linkURL("https://www.treetino.com", (40, btn_y, 140, btn_y + 25), relative=1)
    
    # Phone image constrained to a bounding box
    phone_path = os.path.join(assets_path, "images", "phone.png")
    if os.path.exists(phone_path):
        c.drawImage(phone_path, W - 220, 10, width=200, height=200, preserveAspectRatio=True, mask='auto')

    # 7. FOOTER
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

    # Footer numbers
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 25, "4 z 6")
    c.showPage()


def draw_page_7(c: canvas.Canvas, data: dict, assets_path: str):
    TEXT_COLOR = colors.white
    MUTED_COLOR = colors.HexColor("#94a3b8")
    ACCENT_COLOR = colors.HexColor("#38bdf8")
    CARD_BG = colors.Color(0.12, 0.16, 0.23, alpha=0.8)
    LINE_COLOR = colors.HexColor("#334155")
    
    # 1. Background
    import reportlab.lib.utils as utils
    from PIL import Image
    import io
    main_tree_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "public", "products", "Still_Turbina.png")
    c.saveState()
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    
    if os.path.exists(main_tree_path):
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
    card_h = 440
    card_y = H - 120 - card_h
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
    pozn_h = 130
    pozn_y = card_y - 30 - pozn_h
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
    f_y = pozn_y - 30
    
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
    c.drawCentredString(W / 2, f_y - 50, "Termín dodání dle dohody, připravenosti stanoviště a materiálu.")
    
    # Page num
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 25, "5 z 6")
    c.showPage()


def draw_page_8(c: canvas.Canvas, data: dict, assets_path: str):
    import os
    import reportlab.lib.utils as utils
    
    # 1. Background
    main_tree_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "public", "products", "Still_Strom-v1.png")
    c.saveState()
    
    if os.path.exists(main_tree_path):
        c.drawImage(main_tree_path, 0, 0, width=W, height=H, preserveAspectRatio=False)
    
    # Moderate overlay so text is readable but tree is visible
    c.setFillColor(colors.Color(0.06, 0.08, 0.12, alpha=0.75))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()
    
    # 2. LOGO
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "public", "branding", "logo_horizontal.png")
    
    if os.path.exists(logo_path):
        # We need a large logo, probably white
        c.drawImage(logo_path, W / 2 - 150, H / 2 + 50, width=300, preserveAspectRatio=True, mask='auto')
    else:
        c.setFillColor(colors.white)
        c.setFont("Roboto-Bold", 40)
        c.drawCentredString(W / 2, H / 2 + 50, "TREETINO")
    
    # 3. SLOGAN
    c.setFillColor(colors.white)
    c.setFont("Roboto-Bold", 22)
    c.drawCentredString(W / 2, H / 2, "Budoucnost energetiky zakořeněná")
    c.drawCentredString(W / 2, H / 2 - 30, "v udržitelnosti")
    
    # 4. FOOTER CONTACT
    c.setFont("Roboto-Bold", 16)
    c.drawCentredString(W / 2, 100, "www.treetino.eu")
    c.drawCentredString(W / 2, 75, "+420 730 587 857")
    c.drawCentredString(W / 2, 50, "info@treetino.com")
    
    c.showPage()


def generate_pdf(data: dict) -> bytes:
    buffer = io.BytesIO()
    
    # We need the path to assets to inject images
    import sys
    from pathlib import Path
    assets_path = str(Path(__file__).parent / "assets")
    fonts_path = str(Path(__file__).parent / "fonts")
    
    # Register Roboto Fonts
    try:
        pdfmetrics.registerFont(TTFont("Roboto", os.path.join(fonts_path, "Roboto-Regular.ttf")))
        pdfmetrics.registerFont(TTFont("Roboto-Bold", os.path.join(fonts_path, "Roboto-Bold.ttf")))
    except Exception as e:
        print("Could not register fonts:", e)
    
    c = canvas.Canvas(buffer, pagesize=A4)
    
    draw_page_1(c, data, assets_path)  # Cover
    draw_page_2(c, data, assets_path)  # Product
    draw_page_3(c, data, assets_path)  # Map & Analytics
    draw_page_6(c, data, assets_path)  # Pricing
    draw_page_7(c, data, assets_path)  # Tech Specs
    draw_page_8(c, data, assets_path)  # Outro
    
    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
