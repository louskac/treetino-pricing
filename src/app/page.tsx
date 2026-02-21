"use client";

import React, { useContext } from 'react';
import Link from 'next/link';
import { TreeContext } from '@/src/context/TreeContext';

export default function HomePage() {
    const { userInvestments, assets, userBalance, totalPortfolioValue, totalDailyRevenue } = useContext(TreeContext);

    // Filter list to only owned assets
    const ownedAssets = userInvestments.map(inv => {
        const asset = assets.find(a => a.id === inv.assetId);
        return { ...asset, ...inv }; // Combine mocks
    }).filter(a => a.id !== undefined);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="flex flex-col pb-20">
            {/* Header / Portfolio Summary */}
            <div className="mb-10 pt-4">
                <h1 className="text-3xl font-bold text-white mb-6">My Application</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Portfolio Value Card */}
                    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
                                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Portfolio Value</span>
                            </div>
                            <h2 className="text-4xl font-bold text-white font-mono tracking-tight">
                                {formatCurrency(totalPortfolioValue)}
                            </h2>
                            <p className="text-xs text-secondary mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                +12.4% this month
                            </p>
                        </div>
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
                    </div>

                    {/* Daily Revenue Card */}
                    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-secondary text-2xl">payments</span>
                                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Est. Daily Yield</span>
                            </div>
                            <h2 className="text-4xl font-bold text-white font-mono tracking-tight">
                                {formatCurrency(totalDailyRevenue)}
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Based on current weather conditions
                            </p>
                        </div>
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-secondary/10 rounded-full blur-xl group-hover:bg-secondary/20 transition-all"></div>
                    </div>
                </div>
            </div>

            {/* Assets List */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Your Assets</h2>
                <Link href="/marketplace" className="text-xs font-bold text-primary hover:text-white transition-colors flex items-center gap-1">
                    ADD NEW <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
            </div>

            {ownedAssets.length === 0 ? (
                <div className="glass p-12 rounded-3xl text-center border-dashed border border-white/10 flex flex-col items-center">
                    <span className="material-symbols-outlined text-6xl text-gray-700 mb-4">forest</span>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">Your Garden is Empty</h3>
                    <p className="text-gray-500 text-sm max-w-xs mb-6">Start investing in RWA energy assets to build your portfolio and earn yields.</p>
                    <Link href="/marketplace" className="bg-primary text-black px-6 py-3 rounded-xl font-bold hover:bg-white transition-all">
                        Go to Marketplace
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ownedAssets.map((asset: any) => (
                        <Link
                            href={`/asset/${asset.id}`}
                            key={asset.id}
                            className="glass rounded-2xl p-5 border border-white/5 hover:border-primary/50 hover:bg-white/5 transition-all group relative overflow-hidden block"
                        >
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${asset.color} flex items-center justify-center shadow-lg`}>
                                        <span className="material-symbols-outlined text-black/50 text-xl">
                                            {asset.type.includes('Solar') ? 'solar_power' : 'wind_power'}
                                        </span>
                                    </div>
                                    <span className={`
                                        px-2 py-0.5 rounded text-[10px] font-bold border capitalize
                                        ${asset.status === 'LIVE' ? 'border-primary/30 text-primary bg-primary/10' : 'border-gray-700 text-gray-500'}
                                    `}>
                                        {asset.status.toLowerCase()}
                                    </span>
                                </div>

                                <h3 className="font-bold text-white text-lg leading-tight mb-1">{asset.name}</h3>
                                <p className="text-xs text-gray-500 font-mono mb-4">{asset.location}</p>

                                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase block">Units</span>
                                        <span className="text-sm font-bold text-white">{asset.shareCount.toFixed(1)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-500 uppercase block">Power</span>
                                        <span className={`text-sm font-bold font-mono ${asset.currentWattage > 0 ? 'text-secondary' : 'text-gray-600'}`}>
                                            {asset.currentWattage ? `${(asset.currentWattage / 1000).toFixed(1)} kW` : 'OFF'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Hover Arrow */}
                            <div className="absolute top-4 right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                <span className="material-symbols-outlined text-primary">arrow_outward</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
