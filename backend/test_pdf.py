import sys
import json
import base64
import traceback
from app.pdf_generator import generate_pdf

def test():
    data = {
        "clientName": "Testovací klient s.r.o.",
        "clientAddress": "Praha 1",
        "consumptionOverride": 12000,
        "result": {
            "numberOfTurbines": 3,
            "dcPowerKw": 20,
            "acPowerKw": 15,
            "annualSolarKwh": 12000,
            "annualWindKwh": 3000,
            "investment": 1000000,
            "paybackPeriod": 5.5,
            "finalPrice": 950000,
            "finalPriceVat": 1149500,
            "subsidyPrice": 665000,
            "co2Savings": 10,
            "treesEquivalent": 500,
            "discountPercent": 5,
            "discountAmount": 50000,
            "totalBeforeDiscount": 1000000,
            "monthlyData": [
                {"month": "Led", "solar": 100, "wind": 200, "total": 300},
                {"month": "Úno", "solar": 100, "wind": 200, "total": 300},
                {"month": "Bře", "solar": 100, "wind": 200, "total": 300},
                {"month": "Dub", "solar": 100, "wind": 200, "total": 300},
                {"month": "Kvě", "solar": 100, "wind": 200, "total": 300},
                {"month": "Čer", "solar": 100, "wind": 200, "total": 300},
                {"month": "Čvc", "solar": 100, "wind": 200, "total": 300},
                {"month": "Srp", "solar": 100, "wind": 200, "total": 300},
                {"month": "Zář", "solar": 100, "wind": 200, "total": 300},
                {"month": "Říj", "solar": 100, "wind": 200, "total": 300},
                {"month": "Lis", "solar": 100, "wind": 200, "total": 300},
                {"month": "Pro", "solar": 100, "wind": 200, "total": 300},
            ]
        }
    }
    
    try:
        pdf_bytes = generate_pdf(data)
        with open("output.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("PDF generated successfully: output.pdf")
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    test()
