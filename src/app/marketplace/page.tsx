"use client";

import React, { useContext, useState, useMemo } from 'react';
import { TreeContext, Asset } from '@/src/context/TreeContext';

const FILTERS = ['All', 'Solar Tree', 'Wind Tree', 'Hybrid Tree'];

export default function MarketplacePage() {
    const { assets, investInAsset, userBalance } = useContext(TreeContext);
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [investmentAmount, setInvestmentAmount] = useState<string>(''); // Now in USD
    const [selectedToken, setSelectedToken] = useState<'MNT' | 'USDT' | 'USDC'>('MNT');

    const MNT_PRICE_USD = 10000; // Fixed mock rate: 1 MNT = $10,000

    // Get live asset data from context (updates after investment)
    const liveAsset = useMemo(() => {
        if (!selectedAsset) return null;
        return assets.find(a => a.id === selectedAsset.id) || selectedAsset;
    }, [selectedAsset, assets]);

    const filteredItems = activeFilter === 'All'
        ? assets
        : assets.filter(item => item.type === activeFilter);

    const handleInvest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAsset) return;

        const amountUsd = parseFloat(investmentAmount);
        if (isNaN(amountUsd) || amountUsd <= 0) return;

        // Convert USD to MNT for the actual contract call
        const amountMnt = amountUsd / MNT_PRICE_USD;

        investInAsset(selectedAsset.id, amountMnt);
        setInvestmentAmount('');
        // Don't close immediately so user sees the progress update
    };

    return (
        <div className="pb-24 relative">
            {/* Header Section */}
            <div className="mb-8 pl-1">
                <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">RWA Marketplace</h1>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <p className="text-gray-400 text-sm">Live Energy Assets Available</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar py-2 pl-1">
                {FILTERS.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-5 py-2.5 rounded-xl border transition-all duration-300 whitespace-nowrap text-sm font-semibold tracking-wide
                            ${activeFilter === filter
                                ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(0,224,255,0.3)]'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1">
                {filteredItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedAsset(item)}
                        className="group glass-panel rounded-3xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,224,255,0.15)] cursor-pointer"
                    >
                        {/* Status Badge */}
                        <div className="absolute top-5 right-5 z-20">
                            {item.status === 'OPEN' && (
                                <span className="glass px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30 shadow-[0_0_10px_rgba(0,224,255,0.2)]">
                                    Fundraising
                                </span>
                            )}
                            {item.status === 'CONSTRUCTED' && (
                                <span className="glass px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-warning border-warning/30">
                                    Construction
                                </span>
                            )}
                            {item.status === 'LIVE' && (
                                <span className="glass px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-secondary border-secondary/30 animate-pulse-glow">
                                    Live Yield
                                </span>
                            )}
                        </div>

                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} p-[1px] shadow-lg`}>
                                <div className="w-full h-full rounded-2xl bg-surface-dark/90 flex items-center justify-center backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-white">
                                        {item.type === 'Solar Tree' ? 'solar_power' : item.type === 'Wind Tree' ? 'wind_power' : 'energy_savings_leaf'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Title & Info */}
                        <div className="mb-6 relative z-10">
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
                            <p className="text-gray-400 text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                {item.location}
                            </p>
                        </div>

                        {/* Progress Bar for Open/Constructed */}
                        {item.status !== 'LIVE' && (
                            <div className="mb-4 relative z-10">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1">
                                    <span>{item.status === 'OPEN' ? 'Funded' : 'Construction'}</span>
                                    <span>{item.status === 'OPEN'
                                        ? `${Math.round((item.raisedAmount / item.targetAmount) * 100)}%`
                                        : `${Math.round(item.constructionProgress)}%`}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${item.status === 'OPEN' ? 'bg-primary' : 'bg-warning'}`}
                                        style={{
                                            width: `${item.status === 'OPEN'
                                                ? (item.raisedAmount / item.targetAmount) * 100
                                                : item.constructionProgress}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mb-2 relative z-10 bg-black/20 rounded-xl p-3 border border-white/5">
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Yield</p>
                                <p className="text-secondary font-bold text-lg drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">{item.yieldApy}</p>
                            </div>
                            <div className="w-[1px] h-8 bg-white/10"></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Data</p>
                                <p className="text-white font-bold text-lg">
                                    {item.status === 'LIVE' ? `${item.dailyRevenue.toFixed(1)}$/d` : `$${item.price}`}
                                </p>
                            </div>
                        </div>

                        {/* Decorative Background Gradients */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-10 blur-[50px] group-hover:opacity-20 transition-opacity duration-500`}></div>
                    </div>
                ))}
            </div>

            {/* Asset Details Overlay */}
            {liveAsset && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedAsset(null)}
                    ></div>

                    <div className="relative w-full max-w-lg bg-[#0F172A] sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl p-6 overflow-hidden animate-float-up max-h-[90vh] overflow-y-auto no-scrollbar pb-32">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${liveAsset.color} p-[1px]`}>
                                    <div className="w-full h-full rounded-2xl bg-[#0F172A] flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-2xl">
                                            {liveAsset.type === 'Solar Tree' ? 'solar_power' : liveAsset.type === 'Wind Tree' ? 'wind_power' : 'energy_savings_leaf'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white leading-tight">{liveAsset.name}</h2>
                                    <p className="text-sm text-gray-400">{liveAsset.type} • {liveAsset.location}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAsset(null)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-gray-400 text-sm">close</span>
                            </button>
                        </div>

                        {/* Status Section */}
                        <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/5 relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Status</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${liveAsset.status === 'LIVE' ? 'border-secondary/50 text-secondary bg-secondary/10' :
                                    liveAsset.status === 'CONSTRUCTED' ? 'border-warning/50 text-warning bg-warning/10' :
                                        'border-primary/50 text-primary bg-primary/10'
                                    }`}>
                                    {liveAsset.status}
                                </span>
                            </div>

                            {/* Lifecycle Visualization */}
                            <div className="relative pt-2 pb-6">
                                <div className="absolute top-[14px] left-0 right-0 h-1 bg-white/10 rounded-full"></div>
                                <div className="absolute top-[14px] left-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000"
                                    style={{ width: liveAsset.status === 'LIVE' ? '100%' : liveAsset.status === 'CONSTRUCTED' ? '66%' : '33%' }}>
                                </div>
                                <div className="flex justify-between relative text-[10px] font-bold uppercase text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border-2 ${liveAsset.status !== 'OPEN' ? 'bg-primary border-primary' : 'bg-[#0F172A] border-primary'} z-10`}></div>
                                        <span className={liveAsset.status === 'OPEN' ? 'text-primary' : ''}>Fundraising</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border-2 ${['CONSTRUCTED', 'LIVE'].includes(liveAsset.status) ? 'bg-warning border-warning' : 'bg-[#0F172A] border-white/20'} z-10`}></div>
                                        <span className={liveAsset.status === 'CONSTRUCTED' ? 'text-warning' : ''}>Building</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border-2 ${liveAsset.status === 'LIVE' ? 'bg-secondary border-secondary' : 'bg-[#0F172A] border-white/20'} z-10`}></div>
                                        <span className={liveAsset.status === 'LIVE' ? 'text-secondary' : ''}>Live</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Content based on status */}
                            <div className="space-y-4 mt-2">
                                {liveAsset.status === 'OPEN' && (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">Raised so far</span>
                                            <span className="text-white font-mono">${liveAsset.raisedAmount.toLocaleString()} / ${liveAsset.targetAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${(liveAsset.raisedAmount / liveAsset.targetAmount) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )}
                                {liveAsset.status === 'CONSTRUCTED' && (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">Construction Progress</span>
                                            <span className="text-warning font-mono">{Math.round(liveAsset.constructionProgress)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                            <div className="h-full bg-warning striped-bar" style={{ width: `${liveAsset.constructionProgress}%` }}></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">* Estimated completion: 2 weeks</p>
                                    </div>
                                )}
                                {liveAsset.status === 'LIVE' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase">Daily Revenue</p>
                                            <p className="text-xl font-bold text-white">${liveAsset.dailyRevenue}</p>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase">Total Produced</p>
                                            <p className="text-xl font-bold text-primary">{Math.round(liveAsset.totalProductionKwh)} kWh</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Investment Form (Only for OPEN assets) */}
                        {liveAsset.status === 'OPEN' ? (
                            <form onSubmit={handleInvest} className="relative z-10">

                                {/* Payment Method Selector (Visual Only) */}
                                <div className="flex gap-2 mb-4">
                                    {['MNT', 'USDT', 'USDC'].map((token) => (
                                        <button
                                            key={token}
                                            type="button"
                                            onClick={() => setSelectedToken(token as any)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${selectedToken === token
                                                ? 'bg-primary/20 border-primary text-white shadow-[0_0_10px_rgba(0,224,255,0.2)]'
                                                : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                                }`}
                                        >
                                            {token === 'MNT' && (
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            )}
                                            {token}
                                        </button>
                                    ))}
                                </div>

                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Investment Amount (USD)</label>
                                <div className="relative mb-4">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                    <input
                                        type="number"
                                        value={investmentAmount}
                                        onChange={(e) => setInvestmentAmount(e.target.value)}
                                        placeholder={`Min $${(liveAsset.price * MNT_PRICE_USD).toFixed(0)}`}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-8 pr-16 text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors font-mono"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-mono">
                                            ≈ {(parseFloat(investmentAmount || '0') / MNT_PRICE_USD).toFixed(1)} MNT
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setInvestmentAmount((userBalance * MNT_PRICE_USD).toFixed(2))}
                                            className="px-2 py-1 bg-white/10 rounded text-xs text-primary hover:bg-white/20"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mb-6">
                                    <span>Available: <span className="text-white">{userBalance.toLocaleString()} MNT</span> <span className="text-gray-600">(≈${(userBalance * MNT_PRICE_USD).toLocaleString()})</span></span>
                                    <span>Rate: <span className="text-gray-400">1 MNT = ${MNT_PRICE_USD}</span></span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!investmentAmount || (parseFloat(investmentAmount) / MNT_PRICE_USD) > userBalance}
                                    className="w-full py-4 bg-gradient-to-r from-primary to-blue-500 rounded-xl font-bold text-black shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Investment
                                </button>
                            </form>
                        ) : (
                            <div className="relative z-10 text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="material-symbols-outlined text-gray-500 text-3xl mb-2">lock_clock</span>
                                <p className="text-gray-400 text-sm">Investment round closed. <br /> Monitoring mode active.</p>
                            </div>
                        )}

                        {/* Decorative BG in Modal */}
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${liveAsset.color} opacity-10 blur-[80px] pointer-events-none`}></div>
                    </div>
                </div>
            )
            }
        </div>
    );
}

// Add this to your global CSS if not present for the bottom-sheet animation
// @keyframes float-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
// .animate-float-up { animation: float-up 0.3s ease-out forwards; }

