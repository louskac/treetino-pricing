import asyncio
import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Query, HTTPException
from fastapi.responses import Response, FileResponse
import traceback
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import httpx
from .calculator import calculate_roi, CalculatorParams
from .pdf_generator import generate_pdf, generate_nda_pdf, generate_mediation_pdf
from .db import (
    init_db,
    get_partners,
    get_deals,
    create_deal,
    update_deal_status,
    save_deal_config,
    update_deal_metadata,
    get_commissions_summary,
    get_db_connection,
    register_user,
    authenticate_user
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
        yield
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Treetino Engine", lifespan=lifespan)

# Allow the React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ROICalculationRequest(BaseModel):
    lat: float
    lon: float
    params: CalculatorParams

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    tier: str
    partner_id: int = None

class CreateDealRequest(BaseModel):
    user_id: int
    partner_id: int = None
    client_name: str
    agent_name: str

class SaveConfigRequest(BaseModel):
    lat: float
    lon: float
    pins_json: str
    energy_price: float
    sunny_days: int
    windy_days: int
    wind_hours: int
    ai_optimization: bool
    web3_enabled: bool
    building_consumption: float
    discount: float
    total_price: float
    commission_forecast: float
    pdf_path: str = None

class UpdateStatusRequest(BaseModel):
    status: str

class SignNdaRequest(BaseModel):
    signature: str
    company: str
    ico_dob: str
    address: str
    representative: str
    location: str

class SignMediationRequest(BaseModel):
    signature: str
    company: str
    ico_dob: str
    address: str
    representative: str
    location: str

class ConfigDict(BaseModel):
    lat: float
    lon: float
    pins_json: str
    energy_price: float
    sunny_days: int
    windy_days: int
    wind_hours: int
    ai_optimization: int
    web3_enabled: int
    building_consumption: float
    discount: float
    total_price: float
    commission_forecast: float
    pdf_path: Optional[str] = None

class SyncDeal(BaseModel):
    client_name: str
    agent_name: str
    status: str
    created_at: str
    updated_at: str
    ico: Optional[str] = None
    dic: Optional[str] = None
    client_logo: Optional[str] = None
    pdf_path: Optional[str] = None
    config: Optional[ConfigDict] = None

class SyncRequest(BaseModel):
    user_id: int
    deals: List[SyncDeal]

router = APIRouter()

# ─── CRM & Partner Portal Endpoints ───

@router.get("/partners")
def read_partners():
    try:
        return get_partners()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register")
def handle_register(req: RegisterRequest):
    try:
        user_id = register_user(req.username, req.password, req.tier, req.partner_id)
        return {"id": user_id, "status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def handle_login(req: LoginRequest):
    try:
        user = authenticate_user(req.username, req.password)
        if not user:
            raise HTTPException(status_code=401, detail="Nesprávné jméno nebo heslo")
        return user
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/sign-nda")
def handle_sign_nda(user_id: int, req: SignNdaRequest):
    try:
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Uživatel nenalezen")
        
        signed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn.execute("""
            UPDATE users 
            SET nda_signed = 1, nda_signed_at = ?, nda_signature = ?, nda_company = ?, nda_ico_dob = ?, nda_address = ?, nda_representative = ?, nda_location = ?
            WHERE id = ?;
        """, (signed_at, req.signature, req.company, req.ico_dob, req.address, req.representative, req.location, user_id))
        conn.commit()
        
        # Return updated user profile
        row = conn.execute("""
            SELECT u.*, p.name as partner_name
            FROM users u
            LEFT JOIN partners p ON u.partner_id = p.id
            WHERE u.id = ?;
        """, (user_id,)).fetchone()
        return dict(row) if row else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/sign-mediation")
def handle_sign_mediation(user_id: int, req: SignMediationRequest):
    try:
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Uživatel nenalezen")
        
        signed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn.execute("""
            UPDATE users 
            SET mediation_signed = 1, mediation_signed_at = ?, mediation_signature = ?, mediation_company = ?, mediation_ico_dob = ?, mediation_address = ?, mediation_representative = ?, mediation_location = ?
            WHERE id = ?;
        """, (signed_at, req.signature, req.company, req.ico_dob, req.address, req.representative, req.location, user_id))
        conn.commit()
        
        # Return updated user profile
        row = conn.execute("""
            SELECT u.*, p.name as partner_name
            FROM users u
            LEFT JOIN partners p ON u.partner_id = p.id
            WHERE u.id = ?;
        """, (user_id,)).fetchone()
        return dict(row) if row else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deals")
def read_deals(user_id: int = Query(None)):
    try:
        if user_id:
            conn = get_db_connection()
            try:
                row = conn.execute("SELECT is_superadmin FROM users WHERE id = ?", (user_id,)).fetchone()
                if not row:
                    raise HTTPException(status_code=401, detail="Session expired or user not found.")
                is_admin = row["is_superadmin"]
            finally:
                conn.close()
            
            if is_admin:
                return get_deals(user_id=None)  # Admin sees all deals
            else:
                return get_deals(user_id=user_id)  # Regular user only sees their own deals
        return []
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/users")
def read_admin_users(user_id: int = Query(...)):
    try:
        conn = get_db_connection()
        try:
            # Check if user_id is superadmin
            user = conn.execute("SELECT is_superadmin FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user or not user["is_superadmin"]:
                raise HTTPException(status_code=403, detail="Nedostatečná oprávnění")
            
            # Fetch all users
            rows = conn.execute("""
                SELECT u.*, p.name as partner_name
                FROM users u
                LEFT JOIN partners p ON u.partner_id = p.id
            """).fetchall()
            
            users_list = []
            for r in rows:
                user_dict = dict(r)
                # Get deal stats
                stats_row = conn.execute("""
                    SELECT 
                        COUNT(d.id) as deal_count,
                        SUM(CASE WHEN c.total_price IS NOT NULL THEN c.total_price ELSE 0 END) as total_deal_value,
                        SUM(CASE WHEN comm.amount_czk IS NOT NULL THEN comm.amount_czk ELSE 0 END) as total_commission
                    FROM deals d
                    LEFT JOIN configurations c ON d.id = c.deal_id
                    LEFT JOIN commissions comm ON d.id = comm.deal_id
                    WHERE d.user_id = ?
                """, (user_dict["id"],)).fetchone()
                
                user_dict["deal_count"] = stats_row["deal_count"] or 0
                user_dict["total_deal_value"] = stats_row["total_deal_value"] or 0
                user_dict["total_commission"] = stats_row["total_commission"] or 0
                
                # Fetch user's deals
                deal_rows = conn.execute("""
                    SELECT id, client_name, status, created_at
                    FROM deals
                    WHERE user_id = ?
                    ORDER BY id DESC
                """, (user_dict["id"],)).fetchall()
                user_dict["deals"] = [dict(dr) for dr in deal_rows]
                
                users_list.append(user_dict)
                
            return users_list
        finally:
            conn.close()
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deals")
def handle_create_deal(req: CreateDealRequest):
    try:
        deal_id = create_deal(req.user_id, req.partner_id, req.client_name, req.agent_name)
        return {"id": deal_id, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deals/sync")
def sync_deals(req: SyncRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # Verify user exists
            user_exists = conn.execute("SELECT partner_id FROM users WHERE id = ?", (req.user_id,)).fetchone()
            if not user_exists:
                raise HTTPException(status_code=401, detail="Uživatel nebyl nalezen")
                
            partner_id = user_exists["partner_id"]
            
            for d in req.deals:
                # Check if this deal already exists in the backend for this user (by client name and created_at)
                existing = conn.execute(
                    "SELECT id FROM deals WHERE user_id = ? AND client_name = ? AND created_at = ?",
                    (req.user_id, d.client_name, d.created_at)
                ).fetchone()
                
                if not existing:
                    # Insert deal
                    cursor.execute("""
                        INSERT INTO deals (user_id, partner_id, client_name, agent_name, status, ico, dic, client_logo, pdf_path, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """, (req.user_id, partner_id, d.client_name, d.agent_name, d.status, d.ico, d.dic, d.client_logo, d.pdf_path, d.created_at, d.updated_at))
                    deal_id = cursor.lastrowid
                    
                    # Insert configuration if it exists
                    if d.config:
                        cfg = d.config
                        cursor.execute("""
                            INSERT INTO configurations (
                                deal_id, lat, lon, pins_json, energy_price, sunny_days, windy_days, wind_hours, 
                                ai_optimization, web3_enabled, building_consumption, discount, total_price, 
                                commission_forecast, pdf_path
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """, (deal_id, cfg.lat, cfg.lon, cfg.pins_json, cfg.energy_price, cfg.sunny_days, cfg.windy_days, cfg.wind_hours,
                              cfg.ai_optimization, cfg.web3_enabled, cfg.building_consumption, cfg.discount, cfg.total_price,
                              cfg.commission_forecast, cfg.pdf_path or ""))
                        
                        # Update commission entry
                        deal_status = d.status
                        comm_status = "Forecasted"
                        if deal_status == "Won":
                            comm_status = "Pending"
                        elif deal_status in ["Lost", "Rejected"]:
                            comm_status = "Cancelled"
                            
                        cursor.execute("""
                            INSERT INTO commissions (deal_id, partner_id, amount_czk, status)
                            VALUES (?, ?, ?, ?);
                        """, (deal_id, partner_id, cfg.commission_forecast, comm_status))
            
            conn.commit()
            return {"status": "success"}
        finally:
            conn.close()
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deals/{deal_id}/config")
def handle_save_config(deal_id: int, req: SaveConfigRequest):
    try:
        save_deal_config(
            deal_id=deal_id,
            lat=req.lat,
            lon=req.lon,
            pins_json=req.pins_json,
            energy_price=req.energy_price,
            sunny_days=req.sunny_days,
            windy_days=req.windy_days,
            wind_hours=req.wind_hours,
            ai_optimization=1 if req.ai_optimization else 0,
            web3_enabled=1 if req.web3_enabled else 0,
            building_consumption=req.building_consumption,
            discount=req.discount,
            total_price=req.total_price,
            commission_forecast=req.commission_forecast,
            pdf_path=req.pdf_path
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/deals/{deal_id}/status")
def handle_update_status(deal_id: int, req: UpdateStatusRequest):
    try:
        update_deal_status(deal_id, req.status)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/commissions/summary")
def handle_commissions_summary():
    try:
        return get_commissions_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Calculator Endpoints ───

@router.post("/generate-pdf")
async def handle_generate_pdf(request: dict):
    try:
        # 1. Generate PDF
        pdf_bytes = generate_pdf(request)
        
        # 2. Extract deal logging details
        deal_id = request.get("deal_id")
        user_id = request.get("user_id")
        partner_id = request.get("partner_id")
        
        # Clean user_id and partner_id parameters
        try:
            user_id = int(user_id) if user_id is not None else None
        except (ValueError, TypeError):
            user_id = None

        if partner_id in ("", 0, "null", "undefined", None):
            partner_id = None
        else:
            try:
                partner_id = int(partner_id)
            except (ValueError, TypeError):
                partner_id = None

        # Verify whether the deal_id actually exists in the database.
        # If it doesn't exist, reset deal_id to None so that a new one is created.
        if deal_id:
            try:
                deal_id = int(deal_id)
                conn = get_db_connection()
                try:
                    deal_exists = conn.execute("SELECT 1 FROM deals WHERE id = ?", (deal_id,)).fetchone()
                    if not deal_exists:
                        deal_id = None
                finally:
                    conn.close()
            except (ValueError, TypeError):
                deal_id = None

        agent_name = request.get("agent_name")
        client_name = request.get("clientName", "ACME s.r.o.")
        ico = request.get("ico", "")
        dic = request.get("dic", "")
        client_logo = request.get("clientLogoBase64", "")
        
        # If deal_id is not provided (or was reset), create a new deal
        if not deal_id and user_id and agent_name:
            deal_id = create_deal(
                user_id=user_id,
                partner_id=partner_id,
                client_name=client_name,
                agent_name=agent_name,
                status="In Progress"
            )
            
        # Always save or update the configuration details from the generated offer
        if deal_id:
            location = request.get("location")
            result = request.get("result")
            if location and result:
                save_deal_config(
                    deal_id=deal_id,
                    lat=location.get("lat"),
                    lon=location.get("lon"),
                    pins_json=json.dumps(location.get("pins")),
                    energy_price=request.get("energyCost", 5.0),
                    sunny_days=request.get("sunnyDays", 200),
                    windy_days=request.get("windyDays", 250),
                    wind_hours=request.get("windHours", 7),
                    ai_optimization=1 if request.get("aiOptimization", True) else 0,
                    web3_enabled=1 if request.get("web3Enabled", False) else 0,
                    building_consumption=request.get("consumptionOverride", 360.0),
                    discount=request.get("discount", 0.0),
                    total_price=result.get("finalPrice", 0.0),
                    commission_forecast=result.get("commissionForecast", 0.0)
                )
        
        if deal_id:
            # Save the PDF file to filesystem
            if os.environ.get("VERCEL"):
                pdf_dir = "/tmp/static/pdfs"
            else:
                pdf_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "pdfs")
            os.makedirs(pdf_dir, exist_ok=True)
            pdf_filename = f"deal_{deal_id}.pdf"
            pdf_path = os.path.join(pdf_dir, pdf_filename)
            with open(pdf_path, "wb") as f:
                f.write(pdf_bytes)
                
            # Update the deal columns (ico, dic, client_logo, status)
            update_deal_metadata(deal_id, ico, dic, client_logo, f"/api/deals/{deal_id}/pdf")
            
            # If the deal was 'Prepared', change status to 'In Progress'
            conn = get_db_connection()
            try:
                row = conn.execute("SELECT status FROM deals WHERE id = ?", (deal_id,)).fetchone()
                if row and row["status"] == "Prepared":
                    update_deal_status(deal_id, "In Progress")
            finally:
                conn.close()

        return Response(content=pdf_bytes, media_type="application/pdf")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_details = traceback.format_exc()
        raise HTTPException(status_code=500, detail=error_details)

@router.get("/deals/{deal_id}/pdf")
def get_deal_pdf(deal_id: int):
    if os.environ.get("VERCEL"):
        pdf_dir = "/tmp/static/pdfs"
    else:
        pdf_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "pdfs")
    pdf_path = os.path.join(pdf_dir, f"deal_{deal_id}.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF nebyl nalezen")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"Treetino_Nabidka_{deal_id}.pdf")

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
                raise HTTPException(status_code=502, detail="Chyba externího API")
                
            solar_data = solar_resp.json()
            wind_data = wind_resp.json()
            
            # 3. Perform Calculation
            result = calculate_roi(request.params, solar_data, wind_data)
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/nda/download")
def download_user_nda(user_id: int):
    try:
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Uživatel nenalezen")
        
        if not user["nda_signed"]:
            raise HTTPException(status_code=400, detail="Dohoda o mlčenlivosti (NDA) nebyla tímto uživatelem dosud podepsána.")
        
        user_data = dict(user)
        pdf_bytes = generate_nda_pdf(user_data)
        
        filename = f"NDA_Treetino_{user_data['username']}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/mediation/download")
def download_user_mediation(user_id: int):
    try:
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Uživatel nenalezen")
        
        if not user["mediation_signed"]:
            raise HTTPException(status_code=400, detail="Smlouva o zprostředkování nebyla tímto uživatelem dosud podepsána.")
        
        user_data = dict(user)
        pdf_bytes = generate_mediation_pdf(user_data)
        
        filename = f"Smlouva_Zprostredkovani_Treetino_{user_data['username']}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount the router both at the root (for localhost) and at /api (for Vercel)
app.include_router(router)
app.include_router(router, prefix="/api")