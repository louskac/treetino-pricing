"use client";

import React, { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TreeContext } from '@/src/context/TreeContext';

const NAV_ITEMS = [
    { label: 'Home', icon: 'home', href: '/' },
    { label: 'Marketplace', icon: 'storefront', href: '/marketplace' },
    { label: 'Profile', icon: 'person', href: '/profile' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { userBalance, yieldBalance } = useContext(TreeContext);
    const pathname = usePathname();

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
    };

    return (
        <div className="flex flex-col h-dvh w-full overflow-hidden bg-background-dark text-white font-display relative selection:bg-primary selection:text-black">

            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow opacity-60"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] animate-pulse-glow opacity-40"></div>
            </div>

            {/* Floating Glass Header */}
            <header className="fixed top-4 left-4 right-4 h-16 glass rounded-2xl flex items-center justify-between px-5 z-50 shadow-lg animate-float">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] shadow-[0_0_15px_rgba(0,224,255,0.3)]">
                        <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center overflow-hidden">
                            <img
                                src="https://api.dicebear.com/9.x/avataaars/svg?seed=Jakub"
                                alt="User"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold leading-tight tracking-wide">Hi, Jakub</h1>
                        <p className="text-[10px] text-gray-400 font-mono">Treetino Pilot</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                    {/* MNT Balance */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-300 font-mono">
                            {formatCurrency(userBalance)}
                        </span>
                        <div className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20">
                            <span className="text-[8px] font-bold text-white tracking-wider">MNT</span>
                        </div>
                    </div>

                    {/* TREE Yield */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-primary font-mono drop-shadow-[0_0_8px_rgba(0,224,255,0.5)]">
                            {yieldBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </span>
                        <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>forest</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto scroll-smooth min-h-0 relative z-10 pt-24 pb-28 px-4">
                {children}
            </main>

            {/* Floating Glass Bottom Navigation */}
            <nav className="fixed bottom-6 left-6 right-6 h-20 glass-heavy rounded-3xl z-50 shadow-2xl backdrop-blur-xl border border-white/5">
                <ul className="flex justify-between items-center h-full px-2 max-w-sm mx-auto w-full">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href} className="flex-1">
                                <Link
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-full h-full group relative`}
                                >
                                    {/* Active Indicator Light */}
                                    {isActive && (
                                        <div className="absolute -top-3 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_#00E0FF]"></div>
                                    )}

                                    <div className={`
                                        p-2 rounded-xl transition-all duration-300 relative
                                        ${isActive ? 'text-primary transform -translate-y-1' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                                    `}>
                                        <span
                                            className={`material-symbols-outlined text-3xl transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,224,255,0.6)]' : ''}`}
                                            style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300" }}
                                        >
                                            {item.icon}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${isActive ? 'opacity-100 text-primary translate-y-[-2px]' : 'opacity-0 text-gray-500 -translate-y-2 h-0 overflow-hidden'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}

