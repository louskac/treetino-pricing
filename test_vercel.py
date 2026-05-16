import sys
from pathlib import Path

# Vercel adds the project root to sys.path implicitly for api/index.py
# Let's import the generator
try:
    sys.path.append(str(Path(__file__).parent / "backend"))
    from app.pdf_generator import generate_pdf
except Exception as e:
    print("Import error:", e)
    sys.exit(1)

# Dummy payload reflecting what OfferModal sends
payload = {
    "clientName": "Test Client",
    "clientAddress": "Test Address",
    "result": {
        "annualSolarKwh": 10000,
        "annualWindKwh": 5000,
        "numberOfTurbines": 3,
        "buildingConsumption": 15000,
        "dcPowerKw": 147.0,
        "acPowerKw": 133.31,
        "co2Savings": 73.78,
        "treesEquivalent": 3388,
        "monthlyData": [
            {"month": "Leden", "solar": 100, "wind": 200},
            {"month": "Únor", "solar": 150, "wind": 150},
        ]
    },
    "location": {
        "lat": 50.0811,
        "lon": 14.4512,
        "pins": [{"lat": 50.0811, "lng": 14.4512}]
    },
    "energyCost": 5.0,
    "web3Enabled": False,
    "esgEnabled": True,
    "clientLogoBase64": None,
    "consumptionOverride": None
}

try:
    print("Generating PDF...")
    pdf_bytes = generate_pdf(payload)
    print(f"Success! PDF generated with size: {len(pdf_bytes)} bytes")
except Exception as e:
    import traceback
    print("CRASHED!")
    traceback.print_exc()
