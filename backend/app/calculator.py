import math
from typing import Dict, List, Optional
from pydantic import BaseModel

class ProductSpecs:
    SPECS = {
        'main-tree': {
            'leaves': 300,
            'leafPowerW': 46,
            'turbines': 12,
            'turbinePowerKw': 3,
            'height': 10,
            'baseInvestment': 4900000,
        },
        'small-tree': {
            'leaves': 140,
            'leafPowerW': 46,
            'turbines': 6,
            'turbinePowerKw': 1,
            'height': 5,
            'baseInvestment': 1500000,
        },
        'standalone-turbine': {
            'leaves': 0,
            'leafPowerW': 0,
            'turbines': 0,
            'turbinePowerKw': 3,
            'height': 0,
            'baseInvestment': 100000,
        }
    }

class CalculatorParams(BaseModel):
    productCounts: Dict[str, int]
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
    buildingConsumption: Optional[float] = 360 # MWh
    discount: Optional[float] = 5.0 # Percentage

def adjust_wind_speed(v_ref: float, h_ref: float, target_h: float) -> float:
    if target_h <= 0:
        return v_ref
    alpha = 0.143
    return v_ref * math.pow(target_h / h_ref, alpha)

def calculate_roi(params: CalculatorParams, solar_data: Dict, wind_data: Dict) -> Dict:
    active_leaves = 0
    active_turbines = 0
    investment_czk = 0
    installation_height = params.buildingHeight or 0
    total_units = max(1, sum(params.productCounts.values()))

    total_cap_kwp = 0.0
    total_rated_wind_kw = 0.0
    dc_power_kw = 0.0

    for p_type, count in params.productCounts.items():
        if count <= 0: continue
        specs = ProductSpecs.SPECS.get(p_type, ProductSpecs.SPECS['main-tree'])
        
        active_leaves += specs['leaves'] * count
        if p_type == 'standalone-turbine':
            active_turbines += count
            total_rated_wind_kw += count * specs['turbinePowerKw']
            dc_power_kw += (count * specs['turbinePowerKw'])
        else:
            active_turbines += specs['turbines'] * count
            total_rated_wind_kw += specs['turbines'] * count * specs['turbinePowerKw']
            dc_power_kw += (specs['leaves'] * count * specs['leafPowerW'] / 1000.0) + (specs['turbines'] * count * specs['turbinePowerKw'])
            
        total_cap_kwp += (specs['leaves'] * count * specs['leafPowerW']) / 1000.0
        investment_czk += specs['baseInvestment'] * count
        if specs['height'] > installation_height:
            installation_height = specs['height']

    # 2. Solar Calculation
    solar_yield_factor = solar_data['outputs']['totals']['fixed']['E_y']
    solar_scaling = params.sunnyDays / 200.0
    annual_solar_kwh = total_cap_kwp * solar_yield_factor * solar_scaling
    if params.aiOptimization:
        annual_solar_kwh *= 1.30

    # 3. Wind Calculation (Annual)
    total_op_hours = params.windyDays * params.windHours
    annual_wind_kwh = total_rated_wind_kw * total_op_hours
    
    # 3b. Past Week Production Calculation
    past_week_op_hours = 7 * params.windHours 
    last_week_wind_kwh = total_rated_wind_kw * past_week_op_hours
    
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
    future_ev_revenue = max(0, gross_ev_revenue - ev_charging_operating_costs) * total_units

    max_carbon_tons = 15
    actual_carbon_tons = (max_carbon_tons * params.carbonCreditPercentage) / 100.0
    carbon_price = 1800 
    carbon_verification_costs = 350000 
    gross_carbon_revenue = actual_carbon_tons * carbon_price
    future_carbon_revenue = max(0, gross_carbon_revenue - carbon_verification_costs) * total_units

    helium_monthly = 1800 
    helium_costs = 500 
    future_helium_revenue = params.heliumHotspots * (helium_monthly - helium_costs) * 12 * total_units

    total_future_revenue = future_ev_revenue + future_carbon_revenue + future_helium_revenue
    combined_annual_revenue = total_annual_revenue + (total_future_revenue if params.showFutureRevenue else 0)

    # 6. ROI & Payback
    total_before_discount = investment_czk
    discount_amount = total_before_discount * (params.discount / 100.0)
    final_price = total_before_discount - discount_amount
    vat_percent = 21.0
    final_price_vat = final_price * (1 + vat_percent / 100.0)
    subsidy_price = final_price * 0.70

    roi = (combined_annual_revenue / final_price) * 100 if final_price > 0 else 0
    payback_period = final_price / (combined_annual_revenue if combined_annual_revenue > 0 else 1)
    
    ac_power_kw = round(dc_power_kw * 0.9068, 2)
    co2_savings = round((annual_solar_kwh + annual_wind_kwh) * 0.00025, 2)
    trees_equivalent = round((annual_solar_kwh + annual_wind_kwh) * 0.0115)
    
    energy_from_solar = round((annual_solar_kwh / 1000.0) * 0.88, 2)
    energy_to_building = round(((annual_solar_kwh + annual_wind_kwh) / 1000.0) * 0.88, 2)
    energy_to_grid = round(((annual_solar_kwh + annual_wind_kwh) / 1000.0) - energy_to_building, 2)
    energy_from_grid = round(params.buildingConsumption - energy_from_solar, 2)

    # 7. Monthly Distribution
    monthly_data = []
    solar_monthly = solar_data['outputs']['monthly']['fixed']
    for i, m in enumerate(solar_monthly):
        solar_ratio = m['E_m'] / solar_yield_factor
        wind_ratio = 1 / 12.0
        
        monthly_data.append({
            "month": ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'][i],
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
        "investment": final_price,
        "paybackPeriod": round(payback_period, 1),
        "roi": round(roi, 1),
        "numberOfLeaves": active_leaves,
        "numberOfTurbines": active_turbines,
        "lastWeekKwh": round(last_week_total_kwh, 1),
        "dcPowerKw": round(dc_power_kw, 2),
        "acPowerKw": round(ac_power_kw, 2),
        "co2Savings": co2_savings,
        "treesEquivalent": trees_equivalent,
        "discountPercent": params.discount,
        "discountAmount": discount_amount,
        "vatPercent": vat_percent,
        "totalBeforeDiscount": total_before_discount,
        "finalPrice": final_price,
        "finalPriceVat": final_price_vat,
        "subsidyPrice": subsidy_price,
        "energyToBuilding": energy_to_building,
        "energyToGrid": energy_to_grid,
        "energyFromSolar": energy_from_solar,
        "energyFromGrid": energy_from_grid,
        "buildingConsumption": params.buildingConsumption,
        "futureEvRevenue": round(future_ev_revenue),
        "futureCarbonRevenue": round(future_carbon_revenue),
        "futureHeliumRevenue": round(future_helium_revenue),
        "totalFutureRevenue": round(total_future_revenue),
        "monthlyData": monthly_data
    }
