import asyncio
from fastapi import FastAPI, APIRouter, Query, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx
from .calculator import calculate_roi, CalculatorParams

app = FastAPI(title="Treetino Engine")

# Allow the React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ROICalculationRequest(BaseModel):
    lat: float
    lon: float
    params: CalculatorParams

router = APIRouter()

@router.get("/")
def read_root():
    return {"status": "online"}

@router.get("/pvgis")
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

@router.post("/calculate-roi")
async def handle_calculate_roi(request: ROICalculationRequest):
    try:
        # 1. Fetch Solar Data from PVGIS
        solar_url = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc"
        solar_params = {
            "lat": request.lat,
            "lon": request.lon,
            "peakpower": 1.0,  # We use 1kWp as base to get yield factors
            "loss": 14.0,
            "angle": 35.0,     # Default tilt
            "aspect": 0.0,     # Default azimuth
            "outputformat": "json"
        }
        
        # 2. Fetch Wind Data from Open-Meteo
        wind_url = "https://api.open-meteo.com/v1/forecast"
        wind_params = {
            "latitude": request.lat,
            "longitude": request.lon,
            "hourly": "wind_speed_10m,wind_speed_100m,wind_direction_10m",
            "past_days": 7,
            "forecast_days": 7,
            "wind_speed_unit": "ms"
        }
        
        async with httpx.AsyncClient() as client:
            solar_res_task = client.get(solar_url, params=solar_params)
            wind_res_task = client.get(wind_url, params=wind_params)
            
            solar_resp, wind_resp = await asyncio.gather(solar_res_task, wind_res_task)
            
            if solar_resp.status_code != 200 or wind_resp.status_code != 200:
                raise HTTPException(status_code=502, detail="External API error")
                
            solar_data = solar_resp.json()
            wind_data = wind_resp.json()
            
            # 3. Perform Calculation
            result = calculate_roi(request.params, solar_data, wind_data)
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount the router both at the root (for localhost) and at /api (for Vercel)
app.include_router(router)
app.include_router(router, prefix="/api")