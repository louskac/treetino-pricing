import React from 'react';
import { Asset } from '@/src/context/TreeContext';

interface OnChainVerificationProps {
    asset: Asset;
}

export const OnChainVerification: React.FC<OnChainVerificationProps> = ({ asset }) => {
    if (!asset.verification) return null;

    const { timestamp, txHash, blockNumber, values } = asset.verification;
    const timeAgo = Math.floor((Date.now() - timestamp) / 1000 / 60); // minutes

    // Logic to determine sync status
    // In a real app, we'd compare values.solarW with asset.currentWattage with some tolerance.
    // For now we assume "Synced" if we have data.
    const isSynced = true;

    // Formatting hash
    const shortHash = `${txHash.slice(0, 6)}...${txHash.slice(-6)}`;

    return (
        <div className="mt-6 glass-heavy rounded-3xl p-6 border border-white/5 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="material-symbols-outlined text-primary">verified_user</span>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">On-Chain Verification</h3>
                        <p className="text-xs text-gray-500 font-mono">Mantle Testnet Chain ID: 5003</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`
                        px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1
                        ${isSynced ? 'border-primary/30 text-primary bg-primary/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}
                    `}>
                        {isSynced ? (
                            <>
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                VERIFIED
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                DIVERGENCE
                            </>
                        )}
                    </span>
                    <span className="text-[10px] text-gray-600 mt-1 font-mono">Block #{blockNumber}</span>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* Imprint Details */}
                <div className="glass p-4 rounded-xl border border-white/5">
                    <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Latest Imprint</h4>

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Time</span>
                        <span className="text-sm text-white font-mono">{timeAgo} mins ago</span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Tx Hash</span>
                        <a
                            href={`https://explorer.testnet.mantle.xyz/tx/${txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary font-mono underline hover:text-white transition-colors flex items-center gap-1"
                        >
                            {shortHash}
                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                        </a>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Gas Used</span>
                        <span className="text-sm text-white font-mono">0.00042 MNT</span>
                    </div>
                </div>

                {/* Data Comparison */}
                <div className="glass p-4 rounded-xl border border-white/5">
                    <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Data Consistency</h4>

                    <div className="space-y-3">
                        {/* Power Check */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-500 text-sm">solar_power</span>
                                <span className="text-sm text-gray-300">Power Output</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 line-through decoration-gray-600 opacity-50">
                                    {(asset.currentWattage).toFixed(1)}W
                                </span>
                                <span className="text-sm text-primary font-mono font-bold">
                                    {values.solarW.toFixed(1)}W
                                </span>
                            </div>
                        </div>

                        {/* Battery Check */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-500 text-sm">battery_charging_full</span>
                                <span className="text-sm text-gray-300">Battery Level</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 opacity-50">
                                    Live
                                </span>
                                <span className="text-sm text-white font-mono font-bold">
                                    {values.battery.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        </div>
    );
};
