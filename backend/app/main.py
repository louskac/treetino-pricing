from fastapi import FastAPI, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="Treetino Engine")

# Allow the React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationRequest(BaseModel):
    lat: float
    lon: float
    tree_type: str

@app.get("/")
def read_root():
    return {"status": "online"}

@app.get("/pvgis")
async def proxy_pvgis(
    lat: float,
    lon: float,
    peakpower: float = 1.0,
    loss: float = 14.0,
    angle: float = 35.0,
    aspect: float = 0.0,
    outputformat: str = "json"
):
    url = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc"
    params = {
        "lat": lat,
        "lon": lon,
        "peakpower": peakpower,
        "loss": loss,
        "angle": angle,
        "aspect": aspect,
        "outputformat": outputformat
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        return resp.json()

@app.post("/calculate-roi")
def calculate_roi(request: LocationRequest):
    return {
        "annual_production_kwh": 4500,
        "roi_years": 6.2,
        "esg_co2_offset_tons": 12.5
    }