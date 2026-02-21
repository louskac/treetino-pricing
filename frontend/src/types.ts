// ─── Energy Mode & Products ──────────────────────────────
export type EnergyMode = 'solar' | 'wind';
export type ProductType = 'main-tree' | 'standalone-turbine' | 'small-tree';

// ─── PVGIS Response ───────────────────────────────────────
export interface PVGISMonthly {
    month: number;
    E_d: number;    // avg daily production kWh
    E_m: number;    // avg monthly production kWh
    'H(i)_d': number;
    'H(i)_m': number;
    SD_m: number;
}

export interface PVGISResult {
    inputs: {
        location: { latitude: number; longitude: number; elevation: number };
        pv_module: { peak_power: number };
    };
    outputs: {
        monthly: { fixed: PVGISMonthly[] };
        totals: { fixed: { E_y: number; 'H(i)_y': number; l_total: number } };
    };
}

// ─── Calculation Results ──────────────────────────────────
export interface SolarCalcResult {
    mode: 'solar';
    annualKwh: number;
    monthlyData: { month: string; production: number }[];
    irradianceYear: number;
    totalLoss: number;
    peakPower: number;
}

export interface WindCalcResult {
    mode: 'wind';
    annualKwh: number;
    avgSpeed10m: number;
    avgSpeed100m: number;
    hourlyData: { hour: string; speed10m: number; speed100m: number }[];
    dominantDirection: string;
}

// ─── Open-Meteo Wind Response ─────────────────────────────
export interface WindResult {
    hourly: {
        time: string[];
        wind_speed_10m: number[];
        wind_speed_100m: number[];
        wind_direction_10m: number[];
    };
}

export interface ROIResult {
    annualSolarKwh: number;
    annualWindKwh: number;
    annualSolarRevenue: number;
    annualWindRevenue: number;
    totalAnnualRevenue: number;

    // Investment & ROI
    investment: number;
    paybackPeriod: number;
    roi: number;

    // Specs
    numberOfLeaves: number;
    numberOfTurbines: number;

    // Future Revenue
    futureEvRevenue: number;
    futureCarbonRevenue: number;
    futureHeliumRevenue: number;
    totalFutureRevenue: number;

    // Chart data
    monthlyData: { month: string; solar: number; wind: number; total: number }[];
}

export type CalcResult = ROIResult;

// ─── Spot Potential (Quick Scan) ──────────────────────────
export interface SpotPotential {
    solarIndex: number; // 0-100
    yearlyYieldKwp: number; // kWh/kWp
    avgWindSpeed: number; // m/s
}

// ─── Map Pin ──────────────────────────────────────────────
export interface SelectedLocation {
    lat: number;
    lon: number;
    roofArea: number | null;  // estimated m² from building footprint
    height?: number;          // building height in meters
    buildingId?: string;
    isBuilding: boolean;
    potential?: SpotPotential;
}
