import React from 'react';
import { Asset } from '@/src/context/TreeContext';

interface AssetGaugeProps {
    asset: Asset;
}

export const AssetGauge: React.FC<AssetGaugeProps> = ({ asset }) => {
    const currentWattage = asset.currentWattage || 0;

    // Calculate max scale dynamically (e.g. if 5kW capacity, scale to 6kW)
    const gaugeMax = asset.nominalPower > 0 ? (asset.nominalPower * 1000 * 1.2) : 10;

    // Visual Percentage for the gauge
    const percentage = Math.min((currentWattage / gaugeMax) * 100, 100);

    return (
        <div className="glass-heavy rounded-3xl p-8 border border-white/5 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentWattage > 0 ? 'bg-secondary animate-pulse box-glow' : 'bg-gray-600'}`}></div>
                    <span className="text-sm text-gray-400 uppercase tracking-widest font-mono">
                        {currentWattage > 0 ? 'Active Production' : 'Standby Mode'}
                    </span>
                </div>
                <span className="glass px-3 py-1 rounded text-secondary text-xs border-white/10 font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    LIVE
                </span>
            </div>

            {/* Gauge Container */}
            <div className="relative w-80 h-40 mt-10 mb-6 z-10">
                {/* Background Arc */}
                <div className="w-full h-full border-[20px] border-white/5 rounded-t-full border-b-0 absolute top-0 left-0"></div>

                {/* Dynamic Arc */}
                <svg className="w-full h-full absolute top-0 left-0 overflow-visible" viewBox="0 0 200 100">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#39FF14" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#00E0FF" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                        className="transition-all duration-1000 ease-out"
                        style={{
                            filter: 'drop-shadow(0 0 15px rgba(57, 255, 20, 0.4))'
                        }}
                    />
                </svg>

                {/* Needle / Value */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center transform translate-y-1/2">
                    <div className="flex flex-col items-center">
                        <span className="text-6xl font-bold text-white tracking-tighter drop-shadow-lg">{currentWattage.toFixed(0)}</span>
                        <span className="text-sm text-primary font-bold uppercase tracking-widest mt-2">{asset.nominalPower}kW Max</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-16 w-full max-w-sm border-t border-white/10 pt-6 z-10">
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase mb-1 tracking-wider">Voltage</p>
                    <p className="text-xl font-mono text-white">{asset.voltage?.toFixed(1) || 0}V</p>
                </div>
                <div className="text-center border-l border-r border-white/10 px-4">
                    <p className="text-[10px] text-gray-500 uppercase mb-1 tracking-wider">Current</p>
                    <p className="text-xl font-mono text-white">
                        {asset.voltage > 0 ? (currentWattage / asset.voltage).toFixed(1) : 0}A
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase mb-1 tracking-wider">Yield</p>
                    <p className="text-xl font-mono text-white">{asset.totalProductionKwh.toFixed(1)}kWh</p>
                </div>
            </div>

            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]"></div>
        </div>
    );
};
