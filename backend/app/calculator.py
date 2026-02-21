import math
from typing import Dict, List, Optional
from pydantic import BaseModel

class ProductSpecs:
    SPECS = {
        'main-tree': {
            'leaves': 300,
            'leafPowerW': 43,
            'turbines': 12,
            'turbinePowerKw': 3,
            'height': 10,
            'baseInvestment': 250000,
        },
        'small-tree': {
            'leaves': 180,
            'leafPowerW': 30,
            'turbines': 6,
            'turbinePowerKw': 1,
            'height': 5,
            'baseInvestment': 120000,
        },
        'standalone-turbine': {
            'leaves': 0,
            'leafPowerW': 0,
            'turbines': 0,
            'turbinePowerKw': 2,
            'height': 0,
            'baseInvestment': 15000,
        }
    }

class CalculatorParams(BaseModel):
    productType: str
    investmentUSD: float
    energyPrice: float
    sunnyDays: int
    windyDays: int
    windHours: int
    aiOptimization: bool
    showFutureRevenue: bool
    carsPerDay: int
    carbonCreditPercentage: float
    heliumHotspots: int
    roofArea: Optional[float] = 0
    buildingHeight: Optional[float] = 0

def adjust_wind_speed(v_ref: float, h_ref: float, target_h: float) -> float:
    if target_h <= 0:
        return v_ref
    alpha = 0.143
    return v_ref * math.pow(target_h / h_ref, alpha)

def calculate_roi(params: CalculatorParams, solar_data: Dict, wind_data: Dict) -> Dict:
    specs = ProductSpecs.SPECS.get(params.productType, ProductSpecs.SPECS['main-tree'])
    
    # 1. Determine System Magnitude
    active_leaves = specs['leaves']
    active_turbines = specs['turbines']
    investment_usd = specs['baseInvestment']
    installation_height = specs['height'] if specs['height'] > 0 else params.buildingHeight

    if params.productType == 'standalone-turbine':
        active_turbines = math.floor(params.roofArea / 25)
        investment_usd = active_turbines * specs['baseInvestment']

    # 2. Solar Calculation
    solar_yield_factor = solar_data['outputs']['totals']['fixed']['E_y']
    total_cap_kwp = (active_leaves * specs['leafPowerW']) / 1000.0

    solar_scaling = params.sunnyDays / 200.0
    annual_solar_kwh = total_cap_kwp * solar_yield_factor * solar_scaling
    if params.aiOptimization:
        annual_solar_kwh *= 1.30

    annual_solar_revenue = annual_solar_kwh * params.energyPrice

    # 3. Wind Calculation
    speeds_10m = wind_data['hourly']['wind_speed_10m']
    avg_v_10m = sum(speeds_10m) / len(speeds_10m)
    adjusted_avg_v = adjust_wind_speed(avg_v_10m, 10, installation_height)

    rated_speed = 12.0
    speed_factor = min(1.0, math.pow(adjusted_avg_v / rated_speed, 3))

    total_op_hours = params.windyDays * params.windHours
    annual_wind_kwh = active_turbines * specs['turbinePowerKw'] * speed_factor * total_op_hours
    annual_wind_revenue = annual_wind_kwh * params.energyPrice

    # 4. Combined Revenue
    total_annual_revenue = annual_solar_revenue + annual_wind_revenue

    # 5. Future Revenue Streams
    ev_charging_kwh_per_car = 25
    ev_charging_kwh_per_day = params.carsPerDay * ev_charging_kwh_per_car
    ev_charging_price = 0.40
    ev_charging_days_per_year = 250
    ev_charging_operating_costs = 2000
    gross_ev_revenue = ev_charging_kwh_per_day * ev_charging_price * ev_charging_days_per_year
    future_ev_revenue = max(0, gross_ev_revenue - ev_charging_operating_costs)

    max_carbon_tons = 15
    actual_carbon_tons = (max_carbon_tons * params.carbonCreditPercentage) / 100.0
    carbon_price = 75
    carbon_verification_costs = 15000 # Wait, the TS code says 15000, but logic is gross - costs. If gross is (15*60%*75) = 675, then it's negative.
    # Checking TS code: const carbonVerificationCosts = 15000; ... futureCarbonCreditsRevenue = Math.max(0, grossCarbonRevenue - carbonVerificationCosts);
    # It seems the cost is high, so it only becomes profitable at large scale. I'll stick to provided logic.
    gross_carbon_revenue = actual_carbon_tons * carbon_price
    future_carbon_revenue = max(0, gross_carbon_revenue - carbon_verification_costs)

    helium_monthly = 75
    helium_costs = 20
    future_helium_revenue = params.heliumHotspots * (helium_monthly - helium_costs) * 12

    total_future_revenue = future_ev_revenue + future_carbon_revenue + future_helium_revenue
    combined_annual_revenue = total_annual_revenue + (total_future_revenue if params.showFutureRevenue else 0)

    # 6. ROI & Payback
    roi = (combined_annual_revenue / investment_usd) * 100 if investment_usd > 0 else 0
    payback_period = investment_usd / (combined_annual_revenue if combined_annual_revenue > 0 else 1)

    # 7. Monthly Distribution
    monthly_data = []
    solar_monthly = solar_data['outputs']['monthly']['fixed']
    for i, m in enumerate(solar_monthly):
        solar_ratio = m['E_m'] / solar_yield_factor
        wind_ratio = 1 / 12.0
        
        monthly_data.append({
            "month": ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            "solar": round(annual_solar_kwh * solar_ratio),
            "wind": round(annual_wind_kwh * wind_ratio),
            "total": round(annual_solar_kwh * solar_ratio + annual_wind_kwh * wind_ratio)
        })

    return {
        "annualSolarKwh": round(annual_solar_kwh),
        "annualWindKwh": round(annual_wind_kwh),
        "annualSolarRevenue": round(annual_solar_revenue),
        "annualWindRevenue": round(annual_wind_revenue),
        "totalAnnualRevenue": round(total_annual_revenue),
        "investment": investment_usd,
        "paybackPeriod": round(payback_period, 1),
        "roi": round(roi, 1),
        "numberOfLeaves": active_leaves,
        "numberOfTurbines": active_turbines,
        "futureEvRevenue": round(future_ev_revenue),
        "futureCarbonRevenue": round(future_carbon_revenue),
        "futureHeliumRevenue": round(future_helium_revenue),
        "totalFutureRevenue": round(total_future_revenue),
        "monthlyData": monthly_data
    }
