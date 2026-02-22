import axios from 'axios';
import type { PVGISResult, WindResult, SolarCalcResult, WindCalcResult, SpotPotential } from './types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BACKEND_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

// ─── PVGIS Solar Calculation (via Proxy) ──────────────────
export async function fetchSolarData(
    lat: number,
    lon: number,
    peakPowerKwp: number,
    tiltAngle: number,
    azimuth: number,
): Promise<SolarCalcResult> {
    const { data } = await axios.get<PVGISResult>(
        `${BACKEND_URL}/pvgis`,
        {
            params: {
                lat: lat.toFixed(4),
                lon: lon.toFixed(4),
                peakpower: peakPowerKwp.toFixed(2),
                loss: 14,
                angle: tiltAngle,
                aspect: azimuth,
                outputformat: 'json',
            },
        },
    );

    const monthly = data.outputs.monthly.fixed;
    const totals = data.outputs.totals.fixed;

    return {
        mode: 'solar',
        annualKwh: totals.E_y,
        monthlyData: monthly.map((m) => ({
            month: MONTH_NAMES[m.month - 1],
            production: Math.round(m.E_m),
        })),
        irradianceYear: totals['H(i)_y'],
        totalLoss: totals.l_total,
        peakPower: peakPowerKwp,
    };
}

// ─── Open-Meteo Wind Data ─────────────────────────────────
export async function fetchWindData(
    lat: number,
    lon: number,
): Promise<WindCalcResult> {
    const { data } = await axios.get<WindResult>(
        'https://api.open-meteo.com/v1/forecast',
        {
            params: {
                latitude: lat.toFixed(4),
                longitude: lon.toFixed(4),
                hourly: 'wind_speed_10m,wind_speed_100m,wind_direction_10m',
                forecast_days: 7,
                wind_speed_unit: 'ms',
            },
        },
    );

    const { time, wind_speed_10m, wind_speed_100m, wind_direction_10m } = data.hourly;

    // Average speeds
    const avg10 = wind_speed_10m.reduce((a, b) => a + b, 0) / wind_speed_10m.length;
    const avg100 = wind_speed_100m.reduce((a, b) => a + b, 0) / wind_speed_100m.length;

    // Dominant direction
    const dirBuckets: Record<string, number> = { N: 0, NE: 0, E: 0, SE: 0, S: 0, SW: 0, W: 0, NW: 0 };
    const dirNames = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    wind_direction_10m.forEach((deg) => {
        const idx = Math.round(deg / 45) % 8;
        dirBuckets[dirNames[idx]]++;
    });
    const dominant = Object.entries(dirBuckets).sort((a, b) => b[1] - a[1])[0][0];

    // Estimate annual energy using simplified Betz curve
    // P = 0.5 * ρ * A * Cp * v³,  ρ=1.225, A=π*r² (r=25m for small turbine), Cp=0.35
    const rho = 1.225;
    const radius = 3; // small wind turbine blade radius (meters)
    const area = Math.PI * radius * radius;
    const cp = 0.35;
    const avgCubed = wind_speed_100m.reduce((a, v) => a + v * v * v, 0) / wind_speed_100m.length;
    const avgPowerW = 0.5 * rho * area * cp * avgCubed;
    const annualKwh = (avgPowerW * 8760) / 1000;

    // Sample 24h for chart (take first day)
    const hourlyData = time.slice(0, 24).map((t, i) => ({
        hour: new Date(t).toLocaleTimeString('en', { hour: '2-digit', hour12: false }),
        speed10m: Math.round(wind_speed_10m[i] * 10) / 10,
        speed100m: Math.round(wind_speed_100m[i] * 10) / 10,
    }));

    return {
        mode: 'wind',
        annualKwh: Math.round(annualKwh),
        avgSpeed10m: Math.round(avg10 * 10) / 10,
        avgSpeed100m: Math.round(avg100 * 10) / 10,
        hourlyData,
        dominantDirection: dominant,
    };
}

// ─── Quick Scan (Solar + Wind Potential) ──────────────────
export async function runQuickScan(lat: number, lon: number): Promise<SpotPotential> {
    const [solarRes, windRes] = await Promise.all([
        axios.get<PVGISResult>(`${BACKEND_URL}/pvgis`, {
            params: { lat: lat.toFixed(4), lon: lon.toFixed(4), peakpower: 1, loss: 14, outputformat: 'json' },
        }),
        axios.get<WindResult>('https://api.open-meteo.com/v1/forecast', {
            params: { latitude: lat.toFixed(4), longitude: lon.toFixed(4), hourly: 'wind_speed_100m', forecast_days: 1, wind_speed_unit: 'ms' },
        }),
    ]);

    const yearlyYieldKwp = solarRes.data.outputs.totals.fixed.E_y;
    const speeds = windRes.data.hourly.wind_speed_100m;
    const avgWindSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    const solarIndex = Math.min(100, (yearlyYieldKwp / 1500) * 100);

    return {
        solarIndex: Math.round(solarIndex),
        yearlyYieldKwp: Math.round(yearlyYieldKwp),
        avgWindSpeed: Math.round(avgWindSpeed * 10) / 10,
    };
}
