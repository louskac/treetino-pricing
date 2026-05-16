from reportlab.pdfgen import canvas
from reportlab.lib import colors
import math

c = canvas.Canvas("icons_test.pdf", pagesize=(200, 600))
c.setFillColor(colors.HexColor("#0f172a"))
c.rect(0, 0, 200, 600, fill=1, stroke=0)

rx = 100

# 1. Power
c.setFont("Helvetica-Bold", 26)
c.setFillColor(colors.white)
c.drawCentredString(rx, 520, "49 kW")
c.drawCentredString(rx, 490, "1m²")

# 2. Sun + Wind
block_center_y = 400
c.setStrokeColor(colors.white)
c.setLineWidth(2.0)
sy = block_center_y + 10
cx, cy = rx + 5, sy + 15
c.circle(cx, cy, 7, fill=0, stroke=1)
for angle in range(0, 360, 45):
    rad = math.radians(angle)
    c.line(cx + 10*math.cos(rad), cy + 10*math.sin(rad),
           cx + 15*math.cos(rad), cy + 15*math.sin(rad))

wy = block_center_y - 15
# Wind (Lucide style)
c.line(rx - 30, wy + 8, rx + 10, wy + 8)
c.arc(rx + 5, wy + 3, rx + 15, wy + 13, -90, 180) # top loop

c.line(rx - 20, wy, rx + 5, wy)
c.arc(rx, wy - 5, rx + 10, wy + 5, -90, 180)

c.line(rx - 30, wy - 8, rx + 15, wy - 8)
c.arc(rx + 10, wy - 13, rx + 20, wy - 3, 90, 180) # bottom loop

# 3. AI
ai_y = 250
c.setStrokeColor(colors.white)
c.setLineWidth(2)
c.roundRect(rx - 16, ai_y - 16, 32, 32, 4, stroke=1, fill=0)
c.roundRect(rx - 20, ai_y - 20, 40, 40, 6, stroke=1, fill=0)
c.setFont("Helvetica-Bold", 16)
c.drawCentredString(rx, ai_y - 5, "AI")
c.setLineWidth(1.5)
# Pins
for p in [-8, 0, 8]:
    c.line(rx - 26, ai_y + p, rx - 20, ai_y + p)
    c.line(rx + 20, ai_y + p, rx + 26, ai_y + p)
    c.line(rx + p, ai_y + 20, rx + p, ai_y + 26)
    c.line(rx + p, ai_y - 26, rx + p, ai_y - 20)

# 4. Leaf
leaf_y = 100
c.setStrokeColor(colors.white)
c.setLineWidth(2.0)
c.saveState()
c.translate(rx, leaf_y)
c.rotate(45)
path = c.beginPath()
path.moveTo(0, -18)
path.curveTo(18, -10, 18, 10, 0, 18)
path.curveTo(-18, 10, -18, -10, 0, -18)
c.drawPath(path, fill=0, stroke=1)
c.line(0, -18, 0, 12)
c.restoreState()

c.showPage()
c.save()
