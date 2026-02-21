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
            'baseInvestment': 5000000,
        },
        'small-tree': {
            'leaves': 180,
            'leafPowerW': 30,
            'turbines': 6,
            'turbinePowerKw': 1,
            'height': 5,
            'baseInvestment': 1500000,
        },
        'standalone-turbine': {
            'leaves': 0,
            'leafPowerW': 0,
            'turbines': 0,
            'turbinePowerKw': 2,
            'height': 0,
            'baseInvestment': 100000,
        }
    }

class CalculatorParams(BaseModel):
    productType: str
    unitCount: int
    energyPrice: float
    sunnyDays: int
    windyDays: int
    windHours: int
    aiOptimization: bool
    web3Enabled: bool # Added
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
    active_leaves = specs['leaves'] * params.unitCount
    active_turbines = specs['turbines'] * params.unitCount
    base_investment = specs['baseInvestment']
    
    if params.productType == 'standalone-turbine':
        # For standalone turbines, user selects number of units directly
        active_turbines = params.unitCount
        investment_czk = active_turbines * base_investment
    else:
        investment_czk = params.unitCount * base_investment

    installation_height = specs['height'] if specs['height'] > 0 else params.buildingHeight

    # 2. Solar Calculation
    solar_yield_factor = solar_data['outputs']['totals']['fixed']['E_y']
    total_cap_kwp = (active_leaves * specs['leafPowerW']) / 1000.0

    solar_scaling = params.sunnyDays / 200.0
    annual_solar_kwh = total_cap_kwp * solar_yield_factor * solar_scaling
    if params.aiOptimization:
        annual_solar_kwh *= 1.30

    # 3. Wind Calculation (Annual)
    # We use the forecast part of the data (future 7 days) as a proxy for annual average
    # or just use the whole dataset if it's representative.
    # Open-Meteo returns 14 days (7 past + 7 forecast) if past_days=7 and forecast_days=7
    hourly_speeds = wind_data['hourly']['wind_speed_10m']
    avg_v_10m = sum(hourly_speeds) / len(hourly_speeds)
    adjusted_avg_v = adjust_wind_speed(avg_v_10m, 10, installation_height)

    rated_speed = 12.0
    speed_factor = min(1.0, math.pow(adjusted_avg_v / rated_speed, 3))

    total_op_hours = params.windyDays * params.windHours
    annual_wind_kwh = active_turbines * specs['turbinePowerKw'] * total_op_hours
    
    # 3b. Past Week Production Calculation
    # First 168 hours (7 days) are historical
    past_week_speeds = hourly_speeds[:168]
    past_week_avg_v = sum(past_week_speeds) / len(past_week_speeds)
    past_week_adjusted_v = adjust_wind_speed(past_week_avg_v, 10, installation_height)
    past_week_speed_factor = min(1.0, math.pow(past_week_adjusted_v / rated_speed, 3))
    
    # Assuming the device was active selama windyHours per day in the past week
    past_week_op_hours = 7 * params.windHours 
    last_week_wind_kwh = active_turbines * specs['turbinePowerKw'] * past_week_op_hours
    
    # Solar past week (simplified: 7/365 of annual scaling)
    last_week_solar_kwh = annual_solar_kwh * (7 / 365.0)
    last_week_total_kwh = last_week_solar_kwh + last_week_wind_kwh

    # 4. Combined Revenue & Savings
    annual_energy_savings = (annual_solar_kwh + annual_wind_kwh) * params.energyPrice
    
    # Web3 Bonus: 15% increase if energy is sold to grid
    web3_bonus = 1.15 if params.web3Enabled else 1.0
    total_annual_revenue = annual_energy_savings * web3_bonus

    # 5. Future Revenue Streams (Now also scaled by unit count)
    ev_charging_kwh_per_car = 25
    ev_charging_kwh_per_day = params.carsPerDay * ev_charging_kwh_per_car
    ev_charging_price = 10.0 
    ev_charging_days_per_year = 250
    ev_charging_operating_costs = 50000 
    gross_ev_revenue = ev_charging_kwh_per_day * ev_charging_price * ev_charging_days_per_year
    future_ev_revenue = max(0, gross_ev_revenue - ev_charging_operating_costs) * params.unitCount

    max_carbon_tons = 15
    actual_carbon_tons = (max_carbon_tons * params.carbonCreditPercentage) / 100.0
    carbon_price = 1800 
    carbon_verification_costs = 350000 
    gross_carbon_revenue = actual_carbon_tons * carbon_price
    future_carbon_revenue = max(0, gross_carbon_revenue - carbon_verification_costs) * params.unitCount

    helium_monthly = 1800 
    helium_costs = 500 
    future_helium_revenue = params.heliumHotspots * (helium_monthly - helium_costs) * 12 * params.unitCount

    total_future_revenue = future_ev_revenue + future_carbon_revenue + future_helium_revenue
    combined_annual_revenue = total_annual_revenue + (total_future_revenue if params.showFutureRevenue else 0)

    # 6. ROI & Payback
    roi = (combined_annual_revenue / investment_czk) * 100 if investment_czk > 0 else 0
    payback_period = investment_czk / (combined_annual_revenue if combined_annual_revenue > 0 else 1)

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
        "annualSolarRevenue": round(annual_solar_kwh * params.energyPrice * web3_bonus),
        "annualWindRevenue": round(annual_wind_kwh * params.energyPrice * web3_bonus),
        "totalAnnualRevenue": round(combined_annual_revenue),
        "investment": investment_czk,
        "paybackPeriod": round(payback_period, 1),
        "roi": round(roi, 1),
        "numberOfLeaves": active_leaves,
        "numberOfTurbines": active_turbines,
        "lastWeekKwh": round(last_week_total_kwh, 1), # Added
        "futureEvRevenue": round(future_ev_revenue),
        "futureCarbonRevenue": round(future_carbon_revenue),
        "futureHeliumRevenue": round(future_helium_revenue),
        "totalFutureRevenue": round(total_future_revenue),
        "monthlyData": monthly_data
    }
