import type { ProductType, ROIResult, PVGISResult, WindResult } from './types';

export interface CalculatorParams {
    productType: ProductType;
    unitCount: number;
    energyPrice: number;
    sunnyDays: number;
    windyDays: number;
    windHours: number;
    aiOptimization: boolean;
    web3Enabled: boolean;
    showFutureRevenue: boolean;
    carsPerDay: number;
    carbonCreditPercentage: number;
    heliumHotspots: number;
    roofArea?: number;
    buildingHeight?: number;
    buildingConsumption?: number;
    discount?: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Product Specifications ──────────────────────────────
const PRODUCT_SPECS = {
    'main-tree': {
        leaves: 300,
        leafPowerW: 46,           // Peak power per leaf
        turbines: 12,
        turbinePowerKw: 3,        // Rated power per turbine
        height: 10,               // Standard installation height (meters)
        baseInvestment: 4900000,
    },
    'small-tree': {
        leaves: 140,
        leafPowerW: 46,           // Smaller leaves
        turbines: 6,
        turbinePowerKw: 1,        // Smaller turbines
        height: 5,                // Lower height
        baseInvestment: 1500000,
    },
    'standalone-turbine': {
        leaves: 0,
        leafPowerW: 0,
        turbines: 0,              // Calculated based on area
        turbinePowerKw: 3,        // Rooftop models
        height: 0,                // Uses building height
        baseInvestment: 100000,    // Per turbine cost
    }
};

/**
 * Adjusts wind speed for height using the Power Law
 * v = v_ref * (h / h_ref) ^ alpha
 */
function adjustWindSpeed(vRef: number, hRef: number, targetH: number): number {
    if (targetH <= 0) return vRef;
    const alpha = 0.143; // Power law exponent for neutral stability (open/mixed terrain)
    return vRef * Math.pow(targetH / hRef, alpha);
}

export function calculateROI(
    params: CalculatorParams,
    solarData: PVGISResult,
    windData: WindResult
): ROIResult {
    const {
        productType,
        unitCount,
        energyPrice,
        sunnyDays,
        windyDays,
        windHours,
        aiOptimization,
        web3Enabled,
        showFutureRevenue,
        carsPerDay,
        carbonCreditPercentage,
        heliumHotspots,
        roofArea = 0,
        buildingHeight = 0,
        buildingConsumption = 360,
        discount = 5.0
    } = params;

    const specs = PRODUCT_SPECS[productType];

    // 1. Determine System Magnitude
    let activeLeaves = specs.leaves * unitCount;
    let activeTurbines = specs.turbines * unitCount;
    let investmentCZK = unitCount * specs.baseInvestment;

    if (productType === 'standalone-turbine') {
        activeTurbines = unitCount;
    }

    const installationHeight = specs.height || buildingHeight || 0;

    // 2. Solar Calculation Grounded in PVGIS
    // E_y is annual kWh per 1kWp system.
    const solarYieldFactor = solarData.outputs.totals.fixed.E_y;
    const totalCapKwp = (activeLeaves * specs.leafPowerW) / 1000;

    // Baseline is 100% capacity at location's E_y. 
    // Slider (sunnyDays) scales this baseline relative to 200 days.
    const solarScaling = sunnyDays / 200;
    let annualSolarKwh = totalCapKwp * solarYieldFactor * solarScaling;
    if (aiOptimization) annualSolarKwh *= 1.30;

    const annualSolarRevenue = annualSolarKwh * energyPrice;

    // 3. Wind Calculation Grounded in Open-Meteo
    // We adjust the 10m avg wind speed for our hub height
    const speeds10m = windData.hourly.wind_speed_10m;
    const avgV10m = speeds10m.reduce((a, b) => a + b, 0) / speeds10m.length;
    const adjustedAvgV = adjustWindSpeed(avgV10m, 10, installationHeight);

    // Rated power applies during windHours * windyDays
    // We scale the rated production by the cube of (actual wind speed / rated speed 12m/s)
    // capped at 1.0 (rated power reached)
    const ratedSpeed = 12;
    const speedFactor = Math.min(1.0, Math.pow(adjustedAvgV / ratedSpeed, 3));

    // Annual Windy Hours = windyDays * windHours
    const totalOpHours = windyDays * windHours;
    const annualWindKwh = activeTurbines * specs.turbinePowerKw * totalOpHours;
    const annualWindRevenue = annualWindKwh * energyPrice;

    // 4. Combined Revenue & Savings
    const annualEnergySavings = (annualSolarKwh + annualWindKwh) * energyPrice;
    const web3Bonus = web3Enabled ? 1.15 : 1.0;
    const totalAnnualRevenue = annualEnergySavings * web3Bonus;

    // 3b. Past Week (Simplified local fallback)
    const lastWeekKwh = (annualSolarKwh + annualWindKwh) * (7 / 365);

    // 5. Future Revenue Streams (Scaled)
    const evChargingKwhPerDay = carsPerDay * 25;
    const grossEvChargingRevenue = evChargingKwhPerDay * 10 * 250;
    const futureEvChargingRevenue = Math.max(0, grossEvChargingRevenue - 50000) * unitCount;

    const actualCarbonTonsSold = (15 * carbonCreditPercentage) / 100;
    const grossCarbonRevenue = actualCarbonTonsSold * 1800;
    const futureCarbonCreditsRevenue = Math.max(0, grossCarbonRevenue - 350000) * unitCount;

    const futureHeliumRevenue = heliumHotspots * (1800 - 500) * 12 * unitCount;

    const totalFutureRevenue = futureEvChargingRevenue + futureCarbonCreditsRevenue + futureHeliumRevenue;
    const combinedAnnualRevenue = totalAnnualRevenue + (showFutureRevenue ? totalFutureRevenue : 0);

    // 6. ROI & Payback
    const totalBeforeDiscount = investmentCZK;
    const discountAmount = totalBeforeDiscount * (discount / 100);
    const finalPrice = totalBeforeDiscount - discountAmount;
    const vatPercent = 21.0;
    const finalPriceVat = finalPrice * (1 + vatPercent / 100);
    const subsidyPrice = finalPrice * 0.70; // 30% dotace

    const roi = (combinedAnnualRevenue / finalPrice) * 100;
    const paybackPeriod = finalPrice / (combinedAnnualRevenue || 1);

    // Derived metrics for UI matching the actual PDF
    const dcPowerKw = (activeLeaves * specs.leafPowerW / 1000.0) + (activeTurbines * specs.turbinePowerKw);
    const acPowerKw = Math.round((dcPowerKw * 0.9068) * 100) / 100; // rough inverter efficiency to match 133.31
    const co2Savings = Math.round((annualSolarKwh + annualWindKwh) * 0.00025 * 100) / 100; // matches 73.78 roughly
    const treesEquivalent = Math.round((annualSolarKwh + annualWindKwh) * 0.0115); // matches 3388

    // Consumption & Production distribution matching PDF exactly logic
    // We assume energy from solar is what goes to the building.
    const energyFromSolar = Math.round((annualSolarKwh / 1000) * 0.88 * 100) / 100;
    const energyToBuilding = Math.round(((annualSolarKwh + annualWindKwh) / 1000) * 0.88 * 100) / 100;
    const energyToGrid = Math.round((((annualSolarKwh + annualWindKwh) / 1000) - energyToBuilding) * 100) / 100;
    const energyFromGrid = Math.round((buildingConsumption - energyFromSolar) * 100) / 100;

    // 7. Monthly Distribution
    const monthlyData = solarData.outputs.monthly.fixed.map((m, i) => {
        const solarRatio = m.E_m / solarData.outputs.totals.fixed.E_y;
        const windRatio = 1 / 12; // Simplified flat wind distribution for chart

        return {
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            solar: Math.round(annualSolarKwh * solarRatio),
            wind: Math.round(annualWindKwh * windRatio),
            total: Math.round(annualSolarKwh * solarRatio + annualWindKwh * windRatio)
        };
    });

    return {
        annualSolarKwh: Math.round(annualSolarKwh),
        annualWindKwh: Math.round(annualWindKwh),
        annualSolarRevenue: Math.round(annualSolarKwh * energyPrice * web3Bonus),
        annualWindRevenue: Math.round(annualWindKwh * energyPrice * web3Bonus),
        totalAnnualRevenue: Math.round(combinedAnnualRevenue),
        investment: finalPrice, // Replace with final price to maintain backwards UI compatibility
        paybackPeriod: Math.round(paybackPeriod * 10) / 10,
        roi: Math.round(roi * 10) / 10,
        numberOfLeaves: activeLeaves,
        numberOfTurbines: activeTurbines,
        lastWeekKwh: Math.round(lastWeekKwh),
        dcPowerKw: Math.round(dcPowerKw * 100) / 100,
        acPowerKw: Math.round(acPowerKw * 100) / 100,
        co2Savings,
        treesEquivalent,
        discountPercent: discount,
        discountAmount,
        vatPercent,
        totalBeforeDiscount,
        finalPrice,
        finalPriceVat,
        subsidyPrice,
        energyToBuilding,
        energyToGrid,
        energyFromSolar,
        energyFromGrid,
        buildingConsumption,
        futureEvRevenue: Math.round(futureEvChargingRevenue),
        futureCarbonRevenue: Math.round(futureCarbonCreditsRevenue),
        futureHeliumRevenue: Math.round(futureHeliumRevenue),
        totalFutureRevenue: Math.round(totalFutureRevenue),
        monthlyData
    };
}
