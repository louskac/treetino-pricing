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
    
    # 1. Main Cover Image (Top Header) - with Aspect Ratio Crop
    main_tree_path = os.path.join(assets_path, "products", "main-tree.png")
    if not os.path.exists(main_tree_path):
        main_tree_path = os.path.join(assets_path, "products", "main-tree.jpg")
        
    if os.path.exists(main_tree_path):
        img_cover = utils.ImageReader(main_tree_path)
        img_w, img_h = img_cover.getSize()
        
        target_w = W
        target_h = (target_w / float(img_w)) * img_h
        
        c.saveState()
        path = c.beginPath()
        path.rect(0, H - 220, W, 220)
        c.clipPath(path, stroke=0, fill=0)
        
        if target_h < 220:
            target_h = 220
            target_w = (target_h / float(img_h)) * img_w
            x_pos = (W - target_w) / 2.0
            c.drawImage(main_tree_path, x_pos, H - 220, width=target_w, height=target_h)
        else:
            y_pos = (H - 110) - (target_h / 2.0)
            c.drawImage(main_tree_path, 0, y_pos, width=target_w, height=target_h)
            
        c.restoreState()
    
    # 2. Blue Title Box with rounded corners
    title = f"NABÍDKA 3X STROM V1 - {data.get('clientName', 'M - KOVO').upper()}"
    c.setFont("Roboto-Bold", 14)
    tw = c.stringWidth(title, "Roboto-Bold", 14)
    
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.roundRect(W - tw - 60, H - 110, tw + 40, 24, 6, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.drawString(W - tw - 40, H - 103, title)
    
    # Supplier Name Box
    c.setFont("Roboto-Bold", 10)
    sub1 = "Treetino corp s.r.o."
    sw1 = c.stringWidth(sub1, "Roboto-Bold", 10)
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.roundRect(W - sw1 - 60, H - 138, sw1 + 40, 20, 6, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.drawString(W - sw1 - 40, H - 132, sub1)
    
    # Date Box
    sub2 = "Vystaveno: 02.02.2026"
    sw2 = c.stringWidth(sub2, "Roboto-Bold", 10)
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.roundRect(W - sw2 - 60, H - 162, sw2 + 40, 20, 6, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.drawString(W - sw2 - 40, H - 156, sub2)
    
    # 3. Big Client Logo Or Client Name
    client_logo_b64 = data.get("clientLogoBase64")
    if client_logo_b64:
        if "," in client_logo_b64:
            client_logo_b64 = client_logo_b64.split(",")[1]
        try:
            image_data = base64.b64decode(client_logo_b64)
            img_client = ImageReader(io.BytesIO(image_data))
            cw, ch = img_client.getSize()
            
            scale = min(350.0 / float(cw), 250.0 / float(ch))
            fin_w = cw * scale
            fin_h = ch * scale
            
            c.drawImage(img_client, (W - fin_w) / 2.0, (H - 450) - (fin_h / 2.0), width=fin_w, height=fin_h, mask='auto')
        except Exception as e:
            print("Failed to decode logo:", e)
    else:
        c.setFillColor(colors.HexColor("#2a1b7a"))
        client_name = data.get("clientName", "M - KOVO")
        max_w = W - 100
        font_size = 80
        font_name = "Roboto-Bold"
        
        from reportlab.lib.utils import simpleSplit
        lines = simpleSplit(client_name, font_name, font_size, max_w)
        
        while font_size > 20:
            lines = simpleSplit(client_name, font_name, font_size, max_w)
            too_wide = any(c.stringWidth(ln, font_name, font_size) > max_w for ln in lines)
            if len(lines) <= 2 and not too_wide:
                break
            font_size -= 4

        line_height = font_size * 1.15
        total_h = (len(lines) - 1) * line_height
        y_pos = (H - 450) + (total_h / 2.0)
        
        c.setFont(font_name, font_size)
        for ln in lines:
            c.drawCentredString(W / 2, y_pos, ln)
            y_pos -= line_height
    
    # 4. Treetino Logo Bottom Center
    logo_path = os.path.join(assets_path, "branding", "logo_color.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(assets_path, "images", "logo.jpg")
        
    if os.path.exists(logo_path):
        img_treetino = utils.ImageReader(logo_path)
        tr_w, tr_h = img_treetino.getSize()
        
        scale_tr = min(200.0 / float(tr_w), 80.0 / float(tr_h))
        fin_tr_w = tr_w * scale_tr
        fin_tr_h = tr_h * scale_tr
        
        c.drawImage(logo_path, (W - fin_tr_w) / 2.0, H - 700 - (fin_tr_h / 2.0), width=fin_tr_w, height=fin_tr_h, mask='auto')
    
    # Page num
    c.setFillColor(colors.black)
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "1 z 8")
    c.showPage()


def draw_page_2(c: canvas.Canvas, data: dict, assets_path: str):
    from reportlab.lib.utils import simpleSplit
    result = data.get("result", {})
    
    c.setFont("Roboto-Bold", 14)
    c.setFillColor(colors.HexColor("#3366cc"))
    c.drawString(40, H - 50, "Strom V1")
    c.setLineWidth(1)
    c.setStrokeColor(colors.HexColor("#3366cc"))
    c.line(40, H - 55, W - 40, H - 55)
    
    text = (
        "Naše společnost se specializuje na vývoj a instalaci unikátních energetických infrastruktur v "
        "podobě fotovoltaických stromů, které kombinují špičkový průmyslový design s maximální "
        "efektivitou získávání energie z obnovitelných zdrojů. "
        "Při realizaci klademe nekompromisní důraz na využití komponentů nejvyšší technologické "
        "úrovně. Naše řešení využívá vlastní patentované technologie solárních listů a unikátních "
        "transparentních větrných turbín, které jsou vyvíjeny s ohledem na dlouhou životnost a estetickou "
        "integraci do urbanizovaného prostředí. "
        "Díky úzkému propojení s akademickou sférou a předními technologickými institucemi nejsme "
        "omezeni standardními parametry trhu. To nám umožňuje nabízet energetická řešení šitá na míru "
        "specifickým lokalitám – od obchodních center až po moderní rezidenční čtvrti – s cílem "
        "maximalizovat energetický výnos na minimální zastavěné ploše (již od 1 m2). "
        "Náš tým tvoří zkušení inženýři a odborníci na obnovitelné zdroje a mechatroniku. Projekt "
        "Treetino je realizován za finanční podpory programu Technologická inkubace a spolupracujeme "
        "s předními institucemi a partnery, jako jsou CzechInvest, ČVUT, ČSOB, FZU a dalšími..."
    )
    
    lines = simpleSplit(text, "Roboto", 9, W - 80)
    y_pos = H - 80
    c.setFont("Roboto", 9)
    c.setFillColor(colors.black)
    for line in lines:
        c.drawString(40, y_pos, line)
        y_pos -= 14
    
    main_tree_path = os.path.join(assets_path, "products", "main-tree.png")
    if os.path.exists(main_tree_path):
        c.drawImage(main_tree_path, 40, y_pos - 240, width=W-80, height=220, preserveAspectRatio=True)
        y_pos -= 260

    c.setFont("Roboto", 9)
    c.setFillColor(colors.black)
    c.drawString(40, y_pos, f"V rámci přípravy indikativní cenové nabídky pro společnost {data.get('clientName', 'M - kovo s.r.o.')} jsme předběžně posoudili následující klíčové aspekty:")
    y_pos -= 20
    
    bullets = [
        "Technický stav plochy určené pro instalaci,",
        "Vliv okolních objektů na zastínění panelů + turbín,",
        "Požadavky na výkon a design systému,",
        "Požadavky na požární bezpečnost,",
        "Soulad s platnými legislativními podmínkami,",
        "Získání příslušných dotací a vyřízení administrativních úkonů,"
    ]
    for b in bullets:
        c.drawString(50, y_pos, "• " + b)
        y_pos -= 14

    y_pos -= 20
    c.drawString(40, y_pos, "V rámci přípravy cenové nabídky jsme provedli simulaci plánované instalace. Výsledná data z")
    y_pos -= 14
    c.drawString(40, y_pos, "těchto simulací jsou uvedena na následujících stránkách nabídky.")
    
    # Page num
    c.setFillColor(colors.black)
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "2 z 8")
    c.showPage()


def draw_page_3(c: canvas.Canvas, data: dict, assets_path: str):
    import requests
    import io
    import math
    from PIL import Image
    import reportlab.lib.utils as utils
    import os
    
    result = data.get("result", {})
    annualYield = result.get("annualSolarKwh", 0) + result.get("annualWindKwh", 0)
    
    c.setFillColor(colors.black)
    c.setFont("Roboto-Bold", 10)
    client_name = data.get("clientName", "M KOVO")
    client_addr = data.get("clientAddress", "143, Rantířov, 588 41, Česká republika")
    
    c.drawString(40, H - 50, f"NABÍDKA {result.get('numberOfTurbines', 3)}X STROM V1 AREÁL {str(client_name).upper()}")
    c.setFont("Roboto", 7)
    c.setFillColor(colors.gray)
    c.drawString(40, H - 65, f"{client_addr} | Tomáš Míčka | 2. 2. 2026")
    
    logo_path = os.path.join(assets_path, "branding", "logo.png")
    if os.path.exists(logo_path):
        import reportlab.lib.utils as utils
        try:
            # We want to place the logo precisely at the right margin (W - 40) aligned with the text header.
            # Using anchor='c' usually centers around x,y. Let's just draw manually knowing standard dimensions.
            img_reader = utils.ImageReader(logo_path)
            iw, ih = img_reader.getSize()
            aspect = ih / float(iw)
            logo_w = 90
            logo_h = logo_w * aspect
            c.drawImage(logo_path, W - 40 - logo_w, H - 60, width=logo_w, height=logo_h, preserveAspectRatio=True, mask='auto')
        except: pass

    map_w = W - 80
    map_h = 240
    map_y = H - 320
    
    c.setStrokeColor(colors.lightgrey)
    c.setLineWidth(0.5)
    c.rect(40, map_y, map_w, map_h, fill=0, stroke=1)
    
    # Dynamic Map Composition
    try:
        location = data.get("location", {})
        pins = location.get("pins", [])
        if not pins and location.get("lat"):
            pins = [{"lat": location["lat"], "lng": location["lon"]}]
            
        sw = 800
        sh = int(800 * (map_h / map_w))

        if pins:
            center_lat = sum(p["lat"] for p in pins) / len(pins)
            center_lon = sum(p["lng"] for p in pins) / len(pins)
            
            if len(pins) > 1:
                min_lat = min(p["lat"] for p in pins)
                max_lat = max(p["lat"] for p in pins)
                min_lon = min(p["lng"] for p in pins)
                max_lon = max(p["lng"] for p in pins)
                
                lat_pad = max((max_lat - min_lat) * 0.3, 0.0005)
                lon_pad = max((max_lon - min_lon) * 0.3, 0.0005)
                
                lon_diff = (max_lon - min_lon) + lon_pad * 2
                
                zoom_x = math.log((sw) / ((lon_diff / 360.0) * 512.0)) / math.log(2)
                
                rad_min = math.radians(min_lat - lat_pad)
                rad_max = math.radians(max_lat + lat_pad)
                merc_min = math.log(math.tan(rad_min/2 + math.pi/4))
                merc_max = math.log(math.tan(rad_max/2 + math.pi/4))
                
                zoom_y = math.log((sh) / (((merc_max - merc_min) / (2 * math.pi)) * 512.0)) / math.log(2)
                
                zoom = min(zoom_x, zoom_y)
                zoom = max(15.0, min(19.0, zoom))
            else:
                zoom = 18.0
        else:
            center_lat, center_lon = 50.088, 14.42
            zoom = 18.0
            
        
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
        
        map_image_path = os.path.join(assets_path, "top_view.png")
        if os.path.exists(map_image_path):
            tree_icon = Image.open(map_image_path).convert("RGBA")
            tree_size = 120 # Scale
            tree_icon = tree_icon.resize((tree_size, tree_size), Image.Resampling.LANCZOS)
            
            def latlon_to_pixels(lon, lat, z):
                n = 2.0 ** z
                x = (lon + 180.0) / 360.0 * n * 512
                lat_rad = math.radians(lat)
                y = (1.0 - math.log(math.tan(lat_rad) + (1.0 / math.cos(lat_rad))) / math.pi) / 2.0 * n * 512
                return x, y
            
            cx, cy = latlon_to_pixels(center_lon, center_lat, zoom)
            
            from PIL import ImageDraw
            
            for p in pins:
                px, py = latlon_to_pixels(p["lng"], p["lat"], zoom)
                ix = int(sw + (px - cx) * 2) - tree_size // 2
                iy = int(sh + (py - cy) * 2) - tree_size // 2
                
                # Draw neon circle behind tree to pop
                draw = ImageDraw.Draw(img)
                pad = 8
                draw.ellipse([ix - pad, iy - pad, ix + tree_size + pad, iy + tree_size + pad], outline="#a3e635", width=6)
                
                img.paste(tree_icon, (ix, iy), tree_icon)
        
        final_io = io.BytesIO()
        img.convert("RGB").save(final_io, format="JPEG", quality=90)
        final_io.seek(0)
        c.drawImage(utils.ImageReader(final_io), 40, map_y, width=map_w, height=map_h, preserveAspectRatio=False)
    except Exception as e:
        print("Map generation failed:", e)
        # fallback simple rect
        c.setFillColor(colors.HexColor("#4a5c40"))
        c.rect(40, map_y, map_w, map_h, fill=1, stroke=0)
    
    # Results block
    c.setFillColor(colors.HexColor("#64748b")) # slate text
    c.setFont("Roboto-Bold", 10)
    c.drawString(50, H - 345, "VÝSLEDKY SIMULACE")
    
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.setLineWidth(1)
    
    c.rect(40, H - 440, map_w, 120, fill=0, stroke=1)
    c.line(40, H - 355, W - 40, H - 355)
    
    dcPower = "{:.2f}".format(result.get("dcPowerKw", 147.0)).replace(".", ",")
    acPower = "{:.2f}".format(result.get("acPowerKw", 133.31)).replace(".", ",")
    production = "{:.2f}".format(annualYield / 1000).replace(".", ",")
    co2 = "{:.2f}".format(result.get("co2Savings", 73.78)).replace(".", ",")
    trees = "{:,}".format(result.get("treesEquivalent", 3388)).replace(",", " ")
    
    stats = [
        ("Instalovaný DC Výkon", f"{dcPower} kWp"),
        ("Max Dosažitelný AC Výkon", f"{acPower} kW"),
        ("Roční Výroba Energie", f"{production} MWh"),
        ("Úspora Emisí CO2 (Roční)", f"{co2} t"),
        ("Ekvivalent Vysazených", f"{trees} Stromů")
    ]
    x_offset = 40
    step = (W - 80) / 5
    for i, (label, val) in enumerate(stats):
        icx, icy = x_offset + i*step + step/2, H - 373
        c.setStrokeColor(colors.HexColor("#334155"))
        c.setLineWidth(1.2)
        
        if i == 0:
            c.circle(icx, icy, 5, fill=0, stroke=1)
            for angle in [0, 45, 90, 135, 180, 225, 270, 315]:
                rad = math.radians(angle)
                c.line(icx + 7*math.cos(rad), icy + 7*math.sin(rad), icx + 10*math.cos(rad), icy + 10*math.sin(rad))
        elif i == 1:
            c.circle(icx, icy, 8, fill=0, stroke=1)
            c.circle(icx, icy, 0.5, fill=1, stroke=0)
            c.line(icx, icy, icx + 4, icy + 4)
            c.line(icx - 5, icy - 5, icx - 3, icy - 3)
        elif i == 2:
            c.rect(icx - 8, icy - 8, 16, 16, fill=0, stroke=1)
            c.line(icx - 8, icy + 3, icx + 8, icy + 3)
            for rx in [-4, 4]:
                c.circle(rx + icx, icy - 2, 0.5, fill=1, stroke=0)
                c.circle(rx + icx, icy - 5, 0.5, fill=1, stroke=0)
        elif i == 3:
            path = c.beginPath()
            path.moveTo(icx - 8, icy - 2)
            path.curveTo(icx - 10, icy + 4, icx - 4, icy + 10, icx, icy + 6)
            path.curveTo(icx + 4, icy + 10, icx + 10, icy + 4, icx + 8, icy - 2)
            path.curveTo(icx + 12, icy - 6, icx + 6, icy - 10, icx, icy - 8)
            path.curveTo(icx - 6, icy - 10, icx - 12, icy - 6, icx - 8, icy - 2)
            c.drawPath(path, stroke=1, fill=0)
            c.setFont("Roboto-Bold", 4.5)
            c.setFillColor(colors.HexColor("#334155"))
            c.drawCentredString(icx, icy-1, "CO2")
        elif i == 4:
            path = c.beginPath()
            path.moveTo(icx - 5, icy - 5)
            path.curveTo(icx - 8, icy + 2, icx - 2, icy + 8, icx + 5, icy + 5)
            path.curveTo(icx + 8, icy - 2, icx + 2, icy - 8, icx - 5, icy - 5)
            c.drawPath(path, stroke=1, fill=0)
            c.line(icx - 5, icy - 5, icx, icy)
            
        c.setFont("Roboto-Bold", 6.5)
        c.setFillColor(colors.HexColor("#64748b"))
        if len(label) > 20:
            words = label.split()
            c.drawCentredString(icx, icy - 20, " ".join(words[:2]))
            c.drawCentredString(icx, icy - 28, " ".join(words[2:]))
        else:
            c.drawCentredString(icx, icy - 24, label)
            
        c.setFont("Roboto", 11)
        c.setFillColor(colors.black)
        # Using string splitting to emphasize the unit if it has one
        val_parts = val.split(" ")
        unit = val_parts[-1] if len(val_parts) > 1 else ""
        num = " ".join(val_parts[:-1]) if len(val_parts) > 1 else val
        c.drawCentredString(icx - 5, icy - 45, num)
        c.setFont("Roboto", 7)
        c.setFillColor(colors.HexColor("#64748b"))
        c.drawString(icx - 3 + c.stringWidth(num, "Roboto", 11)/2, icy - 45, unit)
        
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.rect(40, H - 585, map_w, 130, fill=0, stroke=1)
    
    # ------------------ 1. HORIZONTAL BARS (Moved back to Page 3) ------------------ #
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
    
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(50, H - 475, "VÝSLEDKY ROČNÍ SPOTŘEBY A VÝROBY")
    
    c.setFont("Roboto-Bold", 8)
    c.setFillColor(colors.black)
    c.drawString(50, H - 515, "Výroba")
    c.setFont("Roboto-Bold", 12)
    c.drawString(100, H - 515, f"{vyroba_mwh}")
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(100 + c.stringWidth(vyroba_mwh, "Roboto-Bold", 12) + 2, H - 515, "MWh")
    
    c.setFillColor(colors.HexColor("#00ff99"))
    c.roundRect(170, H - 520, 140, 15, 7.5, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Roboto-Bold", 8)
    c.drawCentredString(240, H - 516, f"{vyroba_pct}%")
    
    c.setFillColor(colors.HexColor("#6ee7b7"))
    c.circle(385, H - 508, 2, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Roboto", 6)
    c.drawString(392, H - 510, f"Do budovy {do_budovy} MWh ({vyroba_pct}%)")
    
    c.setFillColor(colors.HexColor("#10b981"))
    c.circle(385, H - 518, 2, fill=1, stroke=0)
    c.drawString(392, H - 520, f"Využití přes kapacitu (do sítě) {do_site} MWh")

    c.setStrokeColor(colors.HexColor("#f1f5f9"))
    c.setLineWidth(1)
    c.line(50, H - 535, W - 50, H - 535)

    c.setFillColor(colors.black)
    c.setFont("Roboto-Bold", 8)
    c.drawString(50, H - 555, "Spotřeba")
    c.setFont("Roboto-Bold", 12)
    c.drawString(100, H - 555, f"{spotreba_mwh}")
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(100 + c.stringWidth(spotreba_mwh, "Roboto-Bold", 12) + 2, H - 555, "MWh")
    
    c.setFillColor(colors.HexColor("#fbbf24"))
    c.roundRect(170, H - 560, 140, 15, 7.5, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#60a5fa"))
    w_blue = min(140.0, max(15.0, (spotreba_pct/100.0) * 140.0))
    c.roundRect(170, H - 560, w_blue, 15, 7.5, fill=1, stroke=0)
    if w_blue < 140:
        c.rect(170 + 7.5, H - 560, w_blue - 7.5, 15, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Roboto-Bold", 8)
    if spotreba_pct > 10:
        c.drawCentredString(170 + (w_blue/2), H - 556, f"{spotreba_pct}%")
    if spotreba_pct < 90:
        c.drawCentredString(170 + w_blue + ((140-w_blue)/2), H - 556, f"{100-spotreba_pct}%")
    
    c.setFillColor(colors.HexColor("#60a5fa"))
    c.circle(385, H - 548, 2, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Roboto", 6)
    c.drawString(392, H - 550, f"Z vlastní výroby {z_sol_mwh} MWh ({spotreba_pct}%)")
    
    c.setFillColor(colors.HexColor("#fbbf24"))
    c.circle(385, H - 558, 2, fill=1, stroke=0)
    c.drawString(392, H - 560, f"Ze sítě {z_site_mwh} MWh ({100-spotreba_pct}%)")
    
    # Page num
    c.setFillColor(colors.black)
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "3 z 8")
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

    # 1. TOP NAV BORDER (Same as Page 3)
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.rect(40, H-90, W-80, 70, stroke=1, fill=0)
    
    import os
    logo_path = os.path.join(assets_path, "images", "logo.jpg")
    try:
        c.drawImage(logo_path, W - 150, H - 75, width=100, preserveAspectRatio=True, mask='auto')
    except:
        c.setFont("Roboto-Bold", 14)
        c.setFillColor(colors.black)
        c.drawString(W - 150, H - 60, "TREETINO")
        
    c.setFont("Roboto-Bold", 14)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(60, H - 55, "NABÍDKA 3X STROM V1 AREÁL M KOVO")
    
    c.setFont("Roboto", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(60, H - 75, "143, Rantířov, 588 41, Česká republika  |  Tomáš Míčke  |  2. 2. 2026")

    # 2. DIAGRAM ZTRÁT SYSTÉMU BOX
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.rect(40, H - 530, W - 80, 420, stroke=1, fill=0)
    
    c.setFont("Roboto-Bold", 12)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawString(60, H - 135, "DIAGRAM ZTRÁT SYSTÉMU")
    
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.setLineWidth(1)
    c.line(40, H - 150, W - 40, H - 150)

    # Waterfall Chart mapping (shifted down)
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(colors.HexColor("#4d94ff"))
    c.drawRightString(230, H - 180, "Globální záření na horizontální rovinu")
    c.rect(240, H - 188, W - 320, 16, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.drawString(244, H - 183, "1,16 MWh/m²")
    
    # Text right of bar
    c.setFillColor(colors.HexColor("#4d94ff"))
    c.drawString(W - 70, H - 195, "+1,78%")

    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Roboto", 9)
    c.drawRightString(230, H - 210, "Globální záření na fotovoltaické panely")
    c.drawRightString(230, H - 240, "Ztráta osvitu zastíněním")
    c.setFillColor(colors.HexColor("#ff4d4d"))
    c.rect(W - 100, H - 245, 20, 14, fill=1, stroke=0)
    c.drawString(W - 70, H - 241, "-4,88%")
    
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawRightString(230, H - 270, "Ztráta odrazem")
    c.setFillColor(colors.HexColor("#ff4d4d"))
    c.rect(W - 120, H - 275, 14, 14, fill=1, stroke=0)
    c.drawString(W - 70, H - 271, "-4,02%")

    c.setFont("Roboto-Bold", 9)
    c.setFillColor(colors.HexColor("#4d94ff"))
    c.drawRightString(230, H - 300, "Energie po FV konverzi")
    c.rect(240, H - 308, W - 360, 16, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.drawString(244, H - 303, "158,38 MWh")

    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Roboto", 9)
    c.drawRightString(230, H - 330, "Ztráta - intenzita záření")
    c.setFillColor(colors.HexColor("#ff4d4d"))
    c.rect(W - 130, H - 335, 6, 14, fill=1, stroke=0)
    c.drawString(W - 70, H - 331, "-1,71%")
    
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawRightString(230, H - 350, "Teplotní ztráta")
    c.drawString(W - 70, H - 350, "-0,58%")
    
    c.drawRightString(230, H - 370, "Elektrické ztráty zastíněním")
    c.setFillColor(colors.HexColor("#ff4d4d"))
    c.rect(W - 140, H - 375, 10, 14, fill=1, stroke=0)
    c.drawString(W - 70, H - 371, "-3,67%")
    
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawRightString(230, H - 390, "Ztráta - kvalita panelu")
    c.setFillColor(colors.HexColor("#4d94ff"))
    c.drawString(W - 70, H - 390, "+0,25%")
    
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawRightString(230, H - 410, "Ztráta - účinnost optimizéru")
    c.setFillColor(colors.HexColor("#ff4d4d"))
    c.rect(W - 145, H - 415, 3, 14, fill=1, stroke=0)
    c.drawString(W - 70, H - 411, "-0,97%")
    
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawRightString(230, H - 430, "Ohmické ztráty na vedení DC")
    c.setFillColor(colors.HexColor("#ff4d4d"))
    c.rect(W - 148, H - 435, 2, 14, fill=1, stroke=0)
    c.drawString(W - 70, H - 431, "-0,57%")
    
    c.setFont("Roboto-Bold", 9)
    c.setFillColor(colors.HexColor("#4d94ff"))
    c.drawRightString(230, H - 460, "Energie po DC ztrátách")
    c.rect(240, H - 468, W - 400, 16, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.drawString(244, H - 463, f"147,17 MWh")
    
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Roboto", 9)
    c.drawRightString(230, H - 490, "Ztráta - účinnost střídače")
    c.setFillColor(colors.HexColor("#ff4d4d"))
    c.rect(W - 170, H - 495, 8, 14, fill=1, stroke=0)
    c.drawString(W - 70, H - 491, "-2,28%")

    c.setFont("Roboto-Bold", 9)
    c.setFillColor(colors.HexColor("#4d94ff"))
    c.drawRightString(230, H - 515, "Vyrobená energie")
    c.rect(240, H - 523, W - 410, 16, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.drawString(244, H - 518, f"{vyroba_mwh} MWh")

    # 3. PARAMETRY SIMULACE BOX
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.rect(40, H - 790, W - 80, 240, fill=0, stroke=1)
    
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Roboto-Bold", 12)
    c.drawString(60, H - 580, "PARAMETRY SIMULACE")
    c.line(40, H - 595, W - 40, H - 595)
    
    # Left Column: POLOHA & SÍŤ
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawString(100, H - 625, "POLOHA & SÍŤ")
    
    c.setFont("Roboto-Bold", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(60, H - 660, "Časové pásmo")
    c.drawString(60, H - 680, "Meteorologická stanice")
    c.drawString(60, H - 700, "Nadmořská výška stanice")
    c.drawString(60, H - 720, "Zdroj dat stanice")
    c.drawString(60, H - 740, "Síť")
    
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#475569"))
    m1 = W/2 - 20
    c.drawRightString(m1, H - 660, ". 2. 2026 SEČ (Prague)")
    c.drawRightString(m1, H - 680, "Kostelní Myslová (25 km daleko)")
    c.drawRightString(m1, H - 700, "569 m")
    c.drawRightString(m1, H - 720, "Meteonorm 8.2")
    c.drawRightString(m1, H - 740, "400V L-L, 230V L-N")

    # Center divider
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.line(W/2, H - 610, W/2, H - 770)
    
    # Right Column: FAKTORY ZTRÁT
    t1_x = W / 2 + 20
    c.setFont("Roboto-Bold", 10)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawString(t1_x + 40, H - 625, "FAKTORY ZTRÁT")
    
    c.setFont("Roboto-Bold", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(t1_x, H - 660, "Blízké zastínění")
    c.drawString(t1_x, H - 680, "Albedo")
    c.drawString(t1_x, H - 700, "Bifaciální Albedo")
    c.drawString(t1_x, H - 720, "Znečištění/Sníh")
    c.drawString(t1_x, H - 740, "Modifikátor úhlu dopadu (IAM), ASHRAE b0 param.")
    c.drawString(t1_x, H - 760, "Faktor tepelné ztráty Uc (const) Zapuštěná montáž")
    c.drawString(t1_x, H - 780, "Faktor tepelné ztráty Uc (const) Montáž ve sklonu")
    
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#475569"))
    m2 = W - 60
    c.drawRightString(m2, H - 660, "Povoleno")
    c.drawRightString(m2, H - 680, "0,20")
    c.drawRightString(m2, H - 700, "0,30")
    c.drawRightString(m2, H - 720, "0%")
    c.drawRightString(m2, H - 740, "0,05")
    c.drawRightString(m2, H - 760, "20")
    c.drawRightString(m2, H - 780, "29")
    
    c.setFillColor(colors.black)
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "5 z 8")
    c.showPage()


def draw_page_6(c: canvas.Canvas, data: dict, assets_path: str):
    result = data.get("result", {})
    
    # Fonts & Colors
    TEXT_COLOR = colors.HexColor("#1e293b")
    MUTED_COLOR = colors.HexColor("#64748b")
    LINK_COLOR = colors.HexColor("#38bdf8")
    LINE_COLOR = colors.HexColor("#e2e8f0")
    BG_COLOR = colors.HexColor("#f8fafc")
    
    # Helpers
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

    # HEADER
    c.setFont("Roboto", 32)
    c.setFillColor(MUTED_COLOR)
    c.drawString(40, H - 60, "NABÍDKA")
    c.drawRightString(W - 40, H - 60, "NAB-26-024")
    
    c.setLineWidth(1)
    c.setStrokeColor(LINE_COLOR)
    c.line(40, H - 75, W - 40, H - 75)
    
    # LEFT COLUMN - Dodavatel
    c.setFont("Roboto", 10)
    c.setFillColor(TEXT_COLOR)
    c.drawString(40, H - 95, "Dodavatel:")
    
    c.setFont("Roboto-Bold", 14)
    c.drawString(40, H - 120, "Treetino corp s.r.o.")
    c.setFont("Roboto", 10)
    c.drawString(40, H - 140, "Česká republika")
    
    # Logo
    import os
    logo_path = os.path.join(assets_path, "images", "logo.jpg")
    try:
        c.drawImage(logo_path, 100, H - 220, width=150, height=50, preserveAspectRatio=True, mask='auto')
    except:
        c.setFont("Roboto-Bold", 16)
        c.drawString(100, H - 200, "TREETINO")
        
    # Kontakt
    c.setFont("Roboto", 10)
    c.drawString(40, H - 260, "Kontaktní údaje:")
    c.drawString(200, H - 260, "Kontaktní osoba:")
    
    c.drawString(40, H - 280, "+420730587857")
    c.drawString(200, H - 280, "Dominik Mašek")
    c.drawString(200, H - 295, "+420730587857")
    c.setFillColor(LINK_COLOR)
    c.drawString(200, H - 310, "info@wattino.eu")
    
    # Vertical line middle
    c.setStrokeColor(LINE_COLOR)
    c.line(W/2 + 20, H - 75, W/2 + 20, H - 320)
    
    # RIGHT COLUMN - Odběratel
    right_x = W/2 + 40
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto", 10)
    c.drawString(right_x, H - 95, "Odběratel:")
    
    client_name = data.get("clientName", "M - KOVO s.r.o.")
    c.setFont("Roboto-Bold", 14)
    c.drawString(right_x, H - 120, str(client_name))
    
    c.setFont("Roboto", 10)
    c.drawString(right_x, H - 140, "Rantířov 143")
    c.drawString(right_x, H - 155, "58841 Rantířov")
    c.drawString(right_x, H - 170, "Česká republika")
    
    c.drawString(right_x, H - 210, "IČO:")
    c.drawString(right_x + 50, H - 210, "25515799")
    c.drawString(right_x, H - 225, "DIČ:")
    c.drawString(right_x + 50, H - 225, "CZ25515799")
    
    # Date Banner
    c.setFillColor(BG_COLOR)
    c.rect(40, H - 350, W - 80, 25, fill=1, stroke=0)
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto", 10)
    c.drawString(45, H - 343, "Vystaveno:")
    c.drawString(120, H - 343, "2.2.2026")
    
    # TABLE
    table_y = H - 400
    c.setStrokeColor(LINE_COLOR)
    
    # Headers
    c.setFillColor(BG_COLOR)
    c.rect(40, table_y, W - 80, 20, fill=1, stroke=1)
    
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto-Bold", 7)
    c.drawString(45, table_y + 6, "Položka")
    c.drawCentredString(230, table_y + 6, "Množ.")
    c.drawCentredString(300, table_y + 6, "Cena/jednotku")
    c.drawCentredString(360, table_y + 6, "Sleva")
    c.drawCentredString(420, table_y + 6, "Celkem")
    c.drawCentredString(475, table_y + 6, "Sazba DPH")
    c.drawRightString(W - 45, table_y + 6, "Celkem vč. DPH")
    
    # Grid lines
    cols = [210, 250, 340, 380, 460, 490]
    for x in cols:
        c.line(x, table_y, x, table_y + 20)
    
    # Item row
    row_y = table_y - 20
    c.rect(40, row_y, W - 80, 20, fill=0, stroke=1)
    for x in cols:
        c.line(x, row_y, x, row_y + 20)
        
    num_turbines = max(result.get("numberOfTurbines", 36), 1)
    units_qty = 3 if final_price > 10000000 else 1
    unit_price = total_before_discount / units_qty
    
    c.setFont("Roboto", 7)
    c.drawString(45, row_y + 6, "Strom V1")
    c.drawCentredString(230, row_y + 6, f"{units_qty} [1 kpl]")
    c.drawRightString(335, row_y + 6, format_czk(unit_price))
    c.drawCentredString(360, row_y + 6, f"{format_units(discount_percent)} %")
    c.drawRightString(455, row_y + 6, format_czk(final_price))
    c.drawCentredString(475, row_y + 6, "21 %")
    c.drawRightString(W - 45, row_y + 6, format_czk(final_price_vat))
    
    # TOTALS BLOCK
    tot_y = row_y - 140
    box_height = 120
    c.setFillColor(BG_COLOR)
    c.rect(W/2 + 20, tot_y, (W/2) - 60, box_height, fill=1, stroke=0)
    
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto", 9)
    
    # 1. Cena bez DPH
    c.drawString(W/2 + 30, tot_y + 100, "Cena bez DPH:")
    c.drawRightString(W - 45, tot_y + 100, format_czk(final_price))
    
    # 2. DPH
    c.drawString(W/2 + 30, tot_y + 85, "DPH (21%):")
    c.drawRightString(W - 45, tot_y + 85, format_czk(vat_amount))
    
    # 3. Cena s DPH
    c.drawString(W/2 + 30, tot_y + 70, "Cena s DPH:")
    c.drawRightString(W - 45, tot_y + 70, format_czk(final_price_vat))
    
    # 4. Dotace
    subsidy_amount = final_price * 0.30
    c.drawString(W/2 + 30, tot_y + 55, "Předpokládaná dotace:")
    c.drawRightString(W - 45, tot_y + 55, f"- {format_czk(subsidy_amount)}")
    
    # 5. Finální cena po dotaci
    c.setFont("Roboto-Bold", 10)
    c.drawString(W/2 + 30, tot_y + 35, "Finální cena po dotaci:")
    c.drawRightString(W - 45, tot_y + 35, format_czk(result.get("subsidyPrice", final_price * 0.70)))
    
    # 6. Personalizovaná sleva (Dynamické pole)
    client_name = data.get('clientName', 'klienta')
    if not client_name or client_name == '':
        client_name = 'klienta'
    
    discount_msg = f"Celková sleva pro {client_name} činí: {format_czk(discount_amount)}"
    c.setFont("Roboto-Bold", 8)
    c.setFillColor(colors.HexColor("#2a1b7a"))
    c.drawString(W/2 + 30, tot_y + 12, discount_msg)
    
    # Left DPH block
    c.setFont("Roboto-Bold", 12)
    c.drawString(40, tot_y + 70, "Rozpis DPH")
    
    dph_y_h = tot_y + 50
    c.setFillColor(BG_COLOR)
    c.rect(40, dph_y_h, W/2 - 60, 15, fill=1, stroke=1)
    
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto-Bold", 7)
    c.drawString(45, dph_y_h + 5, "Sazba %")
    c.drawRightString((W/2 - 20) * 0.75, dph_y_h + 5, "Základ")
    c.drawRightString((W/2 - 20), dph_y_h + 5, "Daň")
    
    c.line(100, dph_y_h, 100, dph_y_h + 15)
    c.line(200, dph_y_h, 200, dph_y_h + 15)
    
    dph_y_r = dph_y_h - 15
    c.rect(40, dph_y_r, W/2 - 60, 15, fill=0, stroke=1)
    c.line(100, dph_y_r, 100, dph_y_r + 15)
    c.line(200, dph_y_r, 200, dph_y_r + 15)
    
    c.setFont("Roboto", 7)
    c.drawCentredString(70, dph_y_r + 5, "21 %")
    c.drawRightString((W/2 - 20) * 0.75 - 5, dph_y_r + 5, format_czk(final_price))
    c.drawRightString((W/2 - 20) - 5, dph_y_r + 5, format_czk(vat_amount))
    
    # TEXT BLOCK BELOW
    text_y = tot_y - 40
    c.setFont("Roboto", 11)
    c.drawString(40, text_y, "Cenová nabídka je prediktivní. Pro přesnou kalkulaci je nutná návštěva technika.")
    c.drawString(40, text_y - 25, "V rámci podpory RES+ pro Vás rádi obstaráme dotaci v maximální možné výši")
    c.drawString(40, text_y - 40, "aktuálně se pohybuje okolo 30 % na způsobilé náklady.")
    
    subsidy_price = format_czk(result.get("subsidyPrice", 9775500))
    msg = f"Po odečtení dotace by cena za {units_qty}ks V1 Stromy mohla být kolem {subsidy_price} Bez DPH"
    c.setFont("Roboto-Bold", 11)
    c.drawString(40, text_y - 70, msg)
    c.line(40, text_y - 72, 40 + c.stringWidth(msg, "Roboto-Bold", 11), text_y - 72)

    # Active Hyperlink
    link_url = "https://www.treetino.com"
    link_text = "Více informací na www.treetino.com"
    link_y = text_y - 100
    c.setFont("Roboto-Bold", 11)
    c.setFillColor(colors.HexColor("#0000EE")) # Standard link blue
    c.drawString(40, link_y, link_text)
    text_width = c.stringWidth(link_text, "Roboto-Bold", 11)
    # rect is (x1, y1, x2, y2)
    c.linkURL(link_url, (40, link_y - 2, 40 + text_width, link_y + 11), relative=1)

    # Footer signature
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
        c.drawString(40, 80 - (idx * 12), s_line)
        
    c.drawRightString(W - 40, 80, "Stránka 1")

    # Page num
    c.setFillColor(colors.black)
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "6 z 8")
    c.showPage()


def draw_page_7(c: canvas.Canvas, data: dict, assets_path: str):
    TEXT_COLOR = colors.HexColor("#1e293b")
    
    col1_x = 40
    col2_x = W / 2 - 40
    
    # 1. Technologie & Fotovoltaické moduly
    c.setFillColor(TEXT_COLOR)
    c.setFont("Roboto-Bold", 11)
    c.drawString(col1_x, H - 70, "Technologie")
    
    c.setFont("Roboto", 11)
    c.drawString(col1_x, H - 85, "Fotovoltaické moduly")
    
    # 1. Right side details
    c.setFont("Roboto-Bold", 11)
    c.drawString(col2_x, H - 70, "Soubory norem (je-li relevantní)")
    
    c.setFont("Roboto", 11)
    c.drawString(col2_x, H - 85, "- splňují IEC 61215, IEC 61730")
    c.drawString(col2_x, H - 100, "účinnost≈21%")
    
    # Text wrapping for Right side items
    t_obj = c.beginText(col2_x, H - 130)
    t_obj.setFont("Roboto", 11)
    t_obj.setLeading(14)
    t_obj.textLine("-   25letá lineární záruka na výkon s")
    t_obj.textLine("    max. poklesem na 80 % původního vý-")
    t_obj.textLine("    konu garantovanou výrobcem")
    c.drawText(t_obj)

    t_obj = c.beginText(col2_x, H - 190)
    t_obj.setFont("Roboto", 11)
    t_obj.setLeading(14)
    t_obj.textLine("-   12letá produktová záruka garanto-")
    t_obj.textLine("    vaná výrobcem")
    c.drawText(t_obj)
    
    # 2. Měniče
    c.setFont("Roboto", 11)
    c.drawString(col1_x, H - 240, "Měniče")
    
    t_obj = c.beginText(col2_x, H - 240)
    t_obj.setFont("Roboto", 11)
    t_obj.setLeading(14)
    t_obj.textLine("-   splňují IEC 61727 nebo IEC 62116")
    t_obj.textLine("    nebo EN 50549-1/EN50549-2, shoda")
    t_obj.textLine("    dle EN 50549-1 rovněž garantováno")
    t_obj.textLine("    označením Tier 1")
    c.drawText(t_obj)
    
    c.drawString(col2_x, H - 320, "- účinnost 98,0 % (Euro účinnost)")
    
    t_obj = c.beginText(col2_x, H - 350)
    t_obj.setFont("Roboto", 11)
    t_obj.setLeading(14)
    t_obj.textLine("-   záruka výrobce či dodavatele trva-")
    t_obj.textLine("    jící 10 let na jeho bezodkladnou vý-")
    t_obj.textLine("    měnu či adekvátní náhradu v případě")
    t_obj.textLine("    poruchy či poškození")
    c.drawText(t_obj)
    
    # 3. VTE
    c.drawString(col1_x, H - 430, "VTE")
    t_obj = c.beginText(col2_x, H - 430)
    t_obj.setFont("Roboto", 11)
    t_obj.setLeading(14)
    t_obj.textLine("-   záruka výrobce či dodavatele trva-")
    t_obj.textLine("    jící 3 let na jeho bezodkladnou vý-")
    t_obj.textLine("    měnu či adekvátní náhradu v případě")
    t_obj.textLine("    poruchy či poškození")
    c.drawText(t_obj)

    # 4. Pozn Text Block
    c.setFont("Roboto-Bold", 10)
    c.drawString(40, H - 510, "Pozn:")
    
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import Paragraph
    styles = getSampleStyleSheet()
    
    # We must register an italic font or simulate it if it doesn't exist
    from reportlab.pdfbase.ttfonts import TTFont
    import sys
    from pathlib import Path
    fonts_path = str(Path(__file__).parent / "fonts")
    try:
        pdfmetrics.registerFont(TTFont("Roboto-Italic", os.path.join(fonts_path, "Roboto-Italic.ttf")))
        italic_font = "Roboto-Italic"
    except:
        italic_font = "Roboto"  # Fallback
        
    p_style = ParagraphStyle(
        "Notes",
        parent=styles["Normal"],
        fontName=italic_font,
        fontSize=10,
        leading=14,
        textColor=TEXT_COLOR
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
    p_w, p_h = p.wrap(W - 80, H)
    p.drawOn(c, 40, H - 510 - p_h)
    
    # footer block below notes
    f_y = H - 510 - p_h - 20
    
    c.setFont("Roboto-Bold", 10)
    c.drawString(40, f_y, "Dodavatel:")
    
    c.setFont("Roboto", 10)
    c.drawString(100, f_y, "Firma: Treetino corp s.r.o.")
    c.drawString(40, f_y - 15, "IČ:10800107 DIČ:CZ10800107 Sídlo: Český")
    c.drawString(40, f_y - 30, "Šternberk 9, 257 26 Český Šternberk")
    
    c.setFont("Roboto-Bold", 10)
    c.drawCentredString(W / 2, 80, "Termín dodání dle dohody, připravenosti stanoviště a materiálu.")
    
    # Page num
    c.setFillColor(colors.black)
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "7 z 8")
    c.showPage()


def draw_page_8(c: canvas.Canvas, data: dict, assets_path: str):
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import Paragraph
    styles = getSampleStyleSheet()
    
    p_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Roboto",
        fontSize=10,
        leading=14,
        textColor=colors.black
    )
    
    disc_text = (
        "Objednatel (kupující) svým podpisem, že seseznámil s „Všeobecnými obchodními podmínkami "
        "společnosti Treetino corp s.r.o.“ ve znění platnémkdatu vystavení této nabídky, že s jejich obsahem "
        "výslovně souhlasí, a že bude v obchodním stykusespolečností Treetino corp s.r.o. jednat plně v sou"
        "ladu s právem a povinnostmi v nich stanovených."
    )
    
    p = Paragraph(disc_text, p_style)
    p_w, p_h = p.wrap(W - 80, H)
    p.drawOn(c, 40, H - 70 - p_h)

    c.setFont("Roboto-Bold", 20)
    str_val = "Děkujeme, za váš čas a spolupráci obojího si vážíme!"
    from reportlab.pdfbase.pdfmetrics import stringWidth
    
    # Manual splitting if too long
    if stringWidth(str_val, "Roboto-Bold", 20) > (W - 80):
        c.drawCentredString(W/2, H/2 + 70, "Děkujeme, za váš čas a spolupráci")
        c.drawCentredString(W/2, H/2 + 40, "obojího si vážíme!")
    else:
        c.drawCentredString(W/2, H/2 + 70, str_val)
    
    import os
    logo_path = os.path.join(assets_path, "branding", "logo_color.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(assets_path, "images", "logo.jpg")
        
    try:
        c.drawImage(logo_path, W/2 - 100, H/2 - 50, width=200, height=66, preserveAspectRatio=True, mask='auto')
    except:
        pass
    
    # Page num
    c.setFillColor(colors.black)
    c.setFont("Roboto", 10)
    c.drawCentredString(W / 2, 30, "8 z 8")
    c.showPage()


def generate_pdf(data: dict) -> bytes:
    buffer = io.BytesIO()
    
    # We need the path to assets to inject images
    import sys
    from pathlib import Path
    assets_path = str(Path(__file__).parent.parent.parent / "frontend" / "public")
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
    draw_page_4(c, data, assets_path)  # Analytics 1
    draw_page_5(c, data, assets_path)  # Analytics 2
    draw_page_3(c, data, assets_path)  # Map
    draw_page_6(c, data, assets_path)  # Pricing
    draw_page_7(c, data, assets_path)  # Contact / Upsell
    
    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
