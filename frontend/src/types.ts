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
    lastWeekKwh: number; // Added

    // Additions for perfect PDF match
    dcPowerKw: number;
    acPowerKw: number;
    co2Savings: number;
    treesEquivalent: number;
    discountPercent: number;
    discountAmount: number;
    vatPercent: number;
    totalBeforeDiscount: number;
    finalPrice: number;
    finalPriceVat: number;
    subsidyPrice: number;
    energyToBuilding: number;
    energyToGrid: number;
    energyFromSolar: number;
    energyFromGrid: number;
    buildingConsumption: number;

    // Future Revenue
    futureEvRevenue: number;
    futureCarbonRevenue: number;
    futureHeliumRevenue: number;
    totalFutureRevenue: number;
    commissionForecast?: number;

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

export interface PinLocation {
    id: string;
    lat: number;
    lng: number;
    type: ProductType;
}

export interface SelectedLocation {
    lat: number;
    lon: number;
    potential?: SpotPotential;
    pins: PinLocation[];
}

// ─── CRM & Partner Portal Types ──────────────────────────
export interface Partner {
    id: number;
    name: string;
    tier: 'Silver' | 'Gold' | 'Platinum';
    commission_rate: number;
    email: string;
}

export interface User {
    id: number;
    username: string;
    tier: 'Silver' | 'Gold' | 'Platinum';
    partner_id?: number | null;
    partner_name?: string | null;
    is_superadmin?: number;
    nda_signed?: number;
    nda_signed_at?: string | null;
    nda_signature?: string | null;
    nda_company?: string | null;
    nda_ico_dob?: string | null;
    nda_address?: string | null;
    nda_representative?: string | null;
    nda_location?: string | null;
}

export interface DealConfig {
    id: number;
    deal_id: number;
    lat: number;
    lon: number;
    pins_json: string;
    energy_price: number;
    sunny_days: number;
    windy_days: number;
    wind_hours: number;
    ai_optimization: number; // 0 or 1
    web3_enabled: number;     // 0 or 1
    building_consumption: number;
    discount: number;
    total_price: number;
    commission_forecast: number;
    pdf_path: string;
}

export interface Commission {
    id: number;
    deal_id: number;
    partner_id: number;
    amount_czk: number;
    status: 'Forecasted' | 'Pending' | 'Paid' | 'Cancelled';
    payout_date?: string;
}

export interface Deal {
    id: number;
    user_id: number;
    partner_id: number;
    client_name: string;
    agent_name: string;
    status: 'Prepared' | 'In Progress' | 'Stuck' | 'Rejected' | 'Won' | 'Lost';
    ico?: string | null;
    dic?: string | null;
    client_logo?: string | null;
    pdf_path?: string | null;
    created_at: string;
    updated_at: string;
    config?: DealConfig | null;
    commission?: Commission | null;
    partner_name?: string;
}
