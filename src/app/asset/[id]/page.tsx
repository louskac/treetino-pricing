"use client";

import React, { useContext, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { TreeContext } from '@/src/context/TreeContext';
import { AssetGauge } from '@/src/components/AssetGauge';
import { AssetCharging } from '@/src/components/AssetCharging';
import { OnChainVerification } from '@/src/components/OnChainVerification';

type Tab = 'MONITOR' | 'CHARGING' | 'SPECS';

export default function AssetDetailsPage() {
    const params = useParams();
    const { getAssetById } = useContext(TreeContext);
    const [activeTab, setActiveTab] = useState<Tab>('MONITOR');

    const assetId = Number(params.id);
    const asset = getAssetById(assetId);

    if (!asset) {
        return (
            <div className="text-center pt-20">
                <h1 className="text-2xl font-bold text-red-500">Asset Not Found</h1>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center pb-20">
            {/* Asset Header */}
            <div className="w-full max-w-4xl mb-8 pl-4 lg:pl-0">
                <div className="flex items-center gap-4 mb-2">
                    <div className={`bg-gradient-to-br ${asset.color} w-3 h-3 rounded-full`}></div>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{asset.location}</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{asset.name}</h1>
                <div className="flex gap-4">
                    <span className={`
                         px-2 py-1 rounded text-[10px] font-bold border
                         ${asset.status === 'LIVE' ? 'border-primary text-primary bg-primary/10' : 'border-gray-600 text-gray-400'}
                     `}>
                        {asset.status}
                    </span>
                    <span className="text-xs text-secondary font-mono pt-1">{asset.yieldApy}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="w-full max-w-4xl flex gap-4 border-b border-white/10 mb-8 px-4 lg:px-0 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('MONITOR')}
                    className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all ${activeTab === 'MONITOR' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    MONITOR
                </button>
                <button
                    onClick={() => setActiveTab('CHARGING')}
                    className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all ${activeTab === 'CHARGING' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    CHARGING
                </button>
                <button
                    onClick={() => setActiveTab('SPECS')}
                    className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all ${activeTab === 'SPECS' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    SPECS
                </button>
            </div>

            {/* Tab Content */}
            <div className="w-full max-w-4xl px-4 lg:px-0">
                {activeTab === 'MONITOR' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {asset.status === 'LIVE' ? (
                            <>
                                <AssetGauge asset={asset} />
                                <OnChainVerification asset={asset} />
                            </>
                        ) : (
                            <div className="glass p-10 rounded-3xl text-center border-dashed border border-white/10">
                                <span className="material-symbols-outlined text-4xl text-gray-600 mb-4">lock_clock</span>
                                <h3 className="text-xl font-bold text-gray-400 mb-2">Monitor Offline</h3>
                                <p className="text-gray-500 text-sm">Real-time telemetry is only available for LIVE assets.</p>
                                <div className="mt-6 w-full max-w-xs mx-auto">
                                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                                        <span>Progress</span>
                                        <span>{asset.constructionProgress.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${asset.constructionProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'CHARGING' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {asset.status === 'LIVE' ? (
                            <AssetCharging asset={asset} />
                        ) : (
                            <div className="glass p-10 rounded-3xl text-center border-dashed border border-white/10">
                                <span className="material-symbols-outlined text-4xl text-gray-600 mb-4">ev_station</span>
                                <h3 className="text-xl font-bold text-gray-400 mb-2">EV Charging Unavailable</h3>
                                <p className="text-gray-500 text-sm">Charging services require a LIVE asset connection.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'SPECS' && (
                    <div className="glass rounded-3xl p-8 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-lg font-bold text-white mb-6">Technical Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Asset Type</label>
                                <p className="text-white font-medium">{asset.type}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Nominal Power</label>
                                <p className="text-white font-medium">{asset.nominalPower} kW</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Location</label>
                                <p className="text-white font-medium">{asset.location}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Purchase Date</label>
                                <p className="text-white font-medium">N/A (Demo)</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Hardware ID</label>
                                <p className="text-white font-mono text-sm">TRT-2026-XJ-{asset.id}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
