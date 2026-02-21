import type { ProductType, ROIResult, PVGISResult, WindResult } from './types';

export interface CalculatorParams {
    productType: ProductType;
    investmentUSD: number;
    energyPrice: number;
    sunnyDays: number;
    windyDays: number;
    windHours: number;
    aiOptimization: boolean;
    showFutureRevenue: boolean;
    carsPerDay: number;
    carbonCreditPercentage: number;
    heliumHotspots: number;
    roofArea?: number;
    buildingHeight?: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Product Specifications ──────────────────────────────
const PRODUCT_SPECS = {
    'main-tree': {
        leaves: 300,
        leafPowerW: 43,           // Peak power per leaf
        turbines: 12,
        turbinePowerKw: 3,        // Rated power per turbine
        height: 10,               // Standard installation height (meters)
        baseInvestment: 250000,
    },
    'small-tree': {
        leaves: 180,
        leafPowerW: 30,           // Smaller leaves
        turbines: 6,
        turbinePowerKw: 1,        // Smaller turbines
        height: 5,                // Lower height
        baseInvestment: 120000,
    },
    'standalone-turbine': {
        leaves: 0,
        leafPowerW: 0,
        turbines: 0,              // Calculated based on area
        turbinePowerKw: 2,        // Rooftop models
        height: 0,                // Uses building height
        baseInvestment: 15000,    // Per turbine cost
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
        energyPrice,
        sunnyDays,
        windyDays,
        windHours,
        aiOptimization,
        showFutureRevenue,
        carsPerDay,
        carbonCreditPercentage,
        heliumHotspots,
        roofArea = 0,
        buildingHeight = 0
    } = params;

    const specs = PRODUCT_SPECS[productType];

    // 1. Determine System Magnitude
    let activeLeaves = specs.leaves;
    let activeTurbines = specs.turbines;
    let investmentUSD = specs.baseInvestment;
    let installationHeight = specs.height || buildingHeight;

    if (productType === 'standalone-turbine') {
        // Installed 5m apart -> square grid -> 25m2 per turbine
        activeTurbines = Math.floor(roofArea / 25);
        investmentUSD = activeTurbines * specs.baseInvestment;
    }

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
    const annualWindKwh = activeTurbines * specs.turbinePowerKw * speedFactor * totalOpHours;
    const annualWindRevenue = annualWindKwh * energyPrice;

    // 4. Combined Revenue
    const totalAnnualRevenue = annualSolarRevenue + annualWindRevenue;

    // 5. Future Revenue Streams
    const evChargingKwhPerCar = 25;
    const evChargingKwhPerDay = carsPerDay * evChargingKwhPerCar;
    const evChargingPrice = 0.40;
    const evChargingDaysPerYear = 250;
    const evChargingOperatingCosts = 2000;
    const grossEvChargingRevenue = evChargingKwhPerDay * evChargingPrice * evChargingDaysPerYear;
    const futureEvChargingRevenue = Math.max(0, grossEvChargingRevenue - evChargingOperatingCosts);

    const maxCarbonTonsPerYear = 15;
    const actualCarbonTonsSold = (maxCarbonTonsPerYear * carbonCreditPercentage) / 100;
    const carbonPricePerTon = 75;
    const carbonVerificationCosts = 15000;
    const grossCarbonRevenue = actualCarbonTonsSold * carbonPricePerTon;
    const futureCarbonCreditsRevenue = Math.max(0, grossCarbonRevenue - carbonVerificationCosts);

    const heliumMonthlyEarnings = 75;
    const heliumOperatingCosts = 20;
    const futureHeliumRevenue = heliumHotspots * (heliumMonthlyEarnings - heliumOperatingCosts) * 12;

    const totalFutureRevenue = futureEvChargingRevenue + futureCarbonCreditsRevenue + futureHeliumRevenue;
    const combinedAnnualRevenue = totalAnnualRevenue + (showFutureRevenue ? totalFutureRevenue : 0);

    // 6. ROI & Payback
    const roi = (combinedAnnualRevenue / investmentUSD) * 100;
    const paybackPeriod = investmentUSD / (combinedAnnualRevenue || 1);

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
        annualSolarRevenue: Math.round(annualSolarRevenue),
        annualWindRevenue: Math.round(annualWindRevenue),
        totalAnnualRevenue: Math.round(totalAnnualRevenue),
        investment: investmentUSD,
        paybackPeriod: Math.round(paybackPeriod * 10) / 10,
        roi: Math.round(roi * 10) / 10,
        numberOfLeaves: activeLeaves,
        numberOfTurbines: activeTurbines,
        futureEvRevenue: Math.round(futureEvChargingRevenue),
        futureCarbonRevenue: Math.round(futureCarbonCreditsRevenue),
        futureHeliumRevenue: Math.round(futureHeliumRevenue),
        totalFutureRevenue: Math.round(totalFutureRevenue),
        monthlyData
    };
}
