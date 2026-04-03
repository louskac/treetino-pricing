import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics.charts.piecharts import Pie

def generate_pdf(data: dict) -> bytes:
    buffer = io.BytesIO()

    # Define document margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    Story = []

    # Define custom styles
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#00E0FF'), # Neon cyan from branding
        spaceAfter=12,
    )

    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#39FF14'), # Neon green
        spaceAfter=20,
    )

    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#FFFFFF'), # White text
        spaceAfter=6,
    )

    bold_style = ParagraphStyle(
        'BoldStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#FFFFFF'),
        spaceAfter=6,
    )

    # Note: We can't easily draw pure background colors for the whole page with SimpleDocTemplate,
    # so we will use dark tables and blocks to simulate the cyberpunk/eco-futurism aesthetic.

    # 1. Header
    Story.append(Paragraph("TREETINO", title_style))
    Story.append(Paragraph("RWA Energy Platform - Investment Proposal", subtitle_style))
    Story.append(Spacer(1, 10))

    # 2. Client Info
    client_name = data.get("clientName", "N/A")
    client_address = data.get("clientAddress", "N/A")

    client_data = [
        [Paragraph("<b>Prepared For:</b>", bold_style), Paragraph(client_name, normal_style)],
        [Paragraph("<b>Site Location:</b>", bold_style), Paragraph(client_address, normal_style)],
    ]

    location = data.get("location", {})
    if location:
        lat = location.get("lat", 0)
        lon = location.get("lon", 0)
        client_data.append([Paragraph("<b>Coordinates:</b>", bold_style), Paragraph(f"{lat:.4f}°N, {lon:.4f}°E", normal_style)])

    client_table = Table(client_data, colWidths=[3*cm, 10*cm])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#050B14')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#333333')),
    ]))

    Story.append(client_table)
    Story.append(Spacer(1, 20))

    # 3. System Summary
    Story.append(Paragraph("System Configuration", subtitle_style))

    result = data.get("result", {})
    leaves = result.get("numberOfLeaves", 0)
    turbines = result.get("numberOfTurbines", 0)
    base_cost = result.get("investment", 0)
    roi = result.get("paybackPeriod", 0)
    total_kwh = result.get("annualSolarKwh", 0) + result.get("annualWindKwh", 0)

    sys_data = [
        ["System Size", f"{leaves} Leaves / {turbines} Turbines"],
        ["Est. Annual Output", f"{total_kwh:,} kWh"],
        ["Total Investment", f"{base_cost:,} CZK"],
        ["Est. ROI Period", f"{roi} Years"]
    ]

    sys_table = Table(sys_data, colWidths=[6*cm, 7*cm])
    sys_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#050B14')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#00E0FF')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#00E0FF')),
    ]))
    Story.append(sys_table)
    Story.append(Spacer(1, 20))

    # 4. Financial Projection
    Story.append(Paragraph("Financial Projections", subtitle_style))

    fin_data = [
        ["Annual Savings (Energy)", f"{result.get('totalAnnualRevenue', 0):,} CZK/yr"],
        ["Future Revenue Potential", f"{result.get('totalFutureRevenue', 0):,} CZK/yr"],
    ]

    fin_table = Table(fin_data, colWidths=[6*cm, 7*cm])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#050B14')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#39FF14')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#39FF14')),
    ]))
    Story.append(fin_table)
    Story.append(Spacer(1, 20))

    # 5. Environmental Impact
    Story.append(Paragraph("Environmental Impact", subtitle_style))
    co2 = (total_kwh * 0.0004)
    env_text = f"By deploying this system, you will offset approximately <b>{co2:.1f} tons of CO₂</b> annually, contributing directly to global sustainability goals."
    Story.append(Paragraph(env_text, ParagraphStyle('EnvText', parent=normal_style, textColor=colors.black)))

    # Build PDF
    # Hack to apply dark background to the whole page by wrapping in a custom PageTemplate or just let the tables pop on white.
    # We will use white background for readability but style the elements darkly.
    doc.build(Story)

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
