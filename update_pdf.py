import os

new_func = """def draw_page_3(c: canvas.Canvas, data: dict, assets_path: str):
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
            zoom = 19.0
        else:
            center_lat, center_lon = 50.088, 14.42
            zoom = 19.0
        
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
            # Mapbox base tile size at scale 1 is 512 px. Since we request @2x, it is 512 * (img_w / sw) = 1024 px.
            physical_tile_size = 512 * (img_w / sw)
            
            # Tree is 17 meters wide
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
            
            # Draw glowing highlight overlays
            overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
            draw_overlay = ImageDraw.Draw(overlay)
            
            for p in pins:
                px, py = latlon_to_pixels(p["lng"], p["lat"], zoom)
                ix = int(img_w / 2 + (px - mcx)) - tree_size // 2
                iy = int(img_h / 2 + (py - mcy)) - tree_size // 2
                
                # Center point of the tree pin
                cx = ix + tree_size // 2
                cy = iy + tree_size // 2
                
                # 1. Semi-transparent cyan spotlight glow
                glow_r = (tree_size // 2) + 24
                draw_overlay.ellipse(
                    [cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r],
                    fill=(56, 189, 248, 30),  # #38bdf8 with ~12% opacity
                    outline=None
                )
                
                # 2. Outer thin target ring
                outer_r = glow_r
                draw_overlay.ellipse(
                    [cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r],
                    outline=(56, 189, 248, 120),  # ~47% opacity
                    width=2
                )
                
                # 3. Inner solid highlight ring
                inner_r = (tree_size // 2) + 6
                draw_overlay.ellipse(
                    [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
                    outline=(56, 189, 248, 255),  # Opaque cyan
                    width=4
                )
                
                # 4. Target locator crosshair ticks
                tick_len = 8
                # Top tick
                draw_overlay.line([cx, cy - outer_r - 2, cx, cy - outer_r + tick_len], fill=(56, 189, 248, 200), width=3)
                # Bottom tick
                draw_overlay.line([cx, cy + outer_r + 2, cx, cy + outer_r - tick_len], fill=(56, 189, 248, 200), width=3)
                # Left tick
                draw_overlay.line([cx - outer_r - 2, cy, cx - outer_r + tick_len, cy], fill=(56, 189, 248, 200), width=3)
                # Right tick
                draw_overlay.line([cx + outer_r + 2, cy, cx + outer_r - tick_len, cy], fill=(56, 189, 248, 200), width=3)
                
                img.paste(tree_icon, (ix, iy), tree_icon)
                
            img = Image.alpha_composite(img, overlay)
        
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
    spotreba_amount = data.get("consumptionOverride", result.get("buildingConsumption", 360.0))
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
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawCentredString(W/2, 60, "Stanice: Kostelní Myslová (25 km daleko), Zdroj: Meteonorm 8.2")

    # Footer
    c.setFont("Roboto", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(40, 50, "Treetino corp s.r.o.")
    c.drawString(40, 40, "IČ: 10800107")
    c.drawString(40, 30, "DIČ: CZ10800107")
    c.drawString(40, 20, "Vlčetin 62, Bílá 463 43")
    
    c.drawCentredString(W / 2, 30, "3 z 6")
    c.showPage()
"""

target = "backend/app/pdf_generator.py"
with open(target, "r") as f:
    content = f.read()

start_idx = content.find("def draw_page_3(")
end_idx = content.find("def draw_page_4(", start_idx)

new_content = content[:start_idx] + new_func + "\n\n" + content[end_idx:]

with open(target, "w") as f:
    f.write(new_content)

print("Updated pdf_generator.py with new draw_page_3")
