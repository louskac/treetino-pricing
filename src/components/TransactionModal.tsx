"use client";

import React, { useState } from 'react';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'DEPOSIT' | 'WITHDRAW';
    onConfirm: (amount: string) => void;
    isLoading?: boolean;
    maxAmount?: number;
}

export function TransactionModal({ isOpen, onClose, title, type, onConfirm, isLoading, maxAmount }: TransactionModalProps) {
    const [amount, setAmount] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#0D1216] border border-white/10 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden">
                {/* Decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${type === 'DEPOSIT' ? 'bg-primary/10' : 'bg-red-500/10'} rounded-full blur-[50px] pointer-events-none`}></div>

                <h3 className="text-xl font-bold text-white mb-6 font-display">{title}</h3>

                <div className="mb-6">
                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                        Amount ({type === 'DEPOSIT' ? 'MNT' : 'TREE'})
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl font-mono text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                            autoFocus
                        />
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-white transition-colors bg-primary/10 px-3 py-1.5 rounded-lg"
                            onClick={() => setAmount(maxAmount ? maxAmount.toString() : '')}
                        >
                            MAX
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(amount)}
                        disabled={!amount || isLoading}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-black transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)] ${type === 'DEPOSIT'
                            ? 'bg-primary hover:bg-white hover:shadow-[0_0_25px_rgba(0,224,255,0.4)]'
                            : 'bg-white text-black hover:bg-gray-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                Confirming...
                            </span>
                        ) : (
                            type === 'DEPOSIT' ? 'Deposit MNT' : 'Withdraw TREE'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
