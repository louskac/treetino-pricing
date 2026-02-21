"use client";

import React, { useContext } from 'react';
import { TreeContext } from '@/src/context/TreeContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { TransactionModal } from '@/src/components/TransactionModal';

const TREASURY_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Using a testnet account as treasury holder

export default function ProfilePage() {
    const { userBalance, yieldBalance, depositMnt, withdrawMnt } = useContext(TreeContext);
    const { sendTransaction } = useSendTransaction();

    const [modalConfig, setModalConfig] = React.useState<{ isOpen: boolean; type: 'DEPOSIT' | 'WITHDRAW' }>({
        isOpen: false,
        type: 'DEPOSIT'
    });

    const handleDepositClick = () => setModalConfig({ isOpen: true, type: 'DEPOSIT' });
    const handleWithdrawClick = () => setModalConfig({ isOpen: true, type: 'WITHDRAW' });
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const handleConfirmTransaction = (amountStr: string) => {
        const amount = parseFloat(amountStr);
        if (!amount) return;

        if (modalConfig.type === 'DEPOSIT') {
            sendTransaction({
                to: TREASURY_ADDRESS,
                value: parseEther(amountStr),
            });
            depositMnt(amount);
        } else {
            withdrawMnt(amount);
            alert("Withdraw request processed. Funds will arrive shortly.");
        }
        closeModal();
    };

    return (
        <div className="flex flex-col items-center pt-10 pb-20">
            <TransactionModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.type === 'DEPOSIT' ? 'Deposit Funds' : 'Withdraw Funds'}
                type={modalConfig.type}
                onConfirm={handleConfirmTransaction}
                maxAmount={modalConfig.type === 'DEPOSIT' ? userBalance : yieldBalance}
            />

            <div className="w-full max-w-2xl px-4">
                <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

                {/* Profile Card */}
                <div className="glass-heavy rounded-3xl p-8 border border-white/5 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-[3px] shadow-[0_0_25px_rgba(0,224,255,0.4)]">
                        <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center overflow-hidden">
                            <img
                                src="https://api.dicebear.com/9.x/avataaars/svg?seed=Jakub"
                                alt="User"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-2xl font-bold text-white">Jakub</h2>
                        <p className="text-primary font-mono text-sm mb-4">Treetino Pilot • Early Adopter</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">Verified Investor</span>
                            <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">Level 5</span>
                        </div>
                    </div>
                </div>

                {/* Wallet Section */}
                <div className="glass rounded-3xl p-8 border border-white/5 mb-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors pointer-events-none"></div>

                    <ConnectButton.Custom>
                        {({
                            account,
                            chain,
                            openAccountModal,
                            openChainModal,
                            openConnectModal,
                            authenticationStatus,
                            mounted,
                        }) => {
                            const ready = mounted && authenticationStatus !== 'loading';
                            const connected =
                                ready &&
                                account &&
                                chain &&
                                (!authenticationStatus ||
                                    authenticationStatus === 'authenticated');

                            if (!connected) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                            <span className="material-symbols-outlined text-3xl text-gray-400">account_balance_wallet</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                                            Connect your Web3 wallet to access your real balance and assets on Mantle Testnet.
                                        </p>
                                        <button
                                            onClick={openConnectModal}
                                            className="px-8 py-3 rounded-xl bg-primary text-black font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,224,255,0.3)] hover:shadow-[0_0_30px_rgba(0,224,255,0.5)] transform hover:-translate-y-1"
                                        >
                                            Connect Wallet
                                        </button>
                                    </div>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <span className="material-symbols-outlined text-4xl text-red-500 mb-4">warning</span>
                                        <h3 className="text-xl font-bold text-white mb-2">Wrong Network</h3>
                                        <p className="text-gray-400 text-sm mb-6">Please switch to Mantle Sepolia Testnet.</p>
                                        <button
                                            onClick={openChainModal}
                                            className="px-6 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
                                        >
                                            Switch Network
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    <div className="flex flex-col gap-6 mb-8">
                                        <div>
                                            <p className="text-sm text-gray-400 font-medium mb-1 uppercase tracking-wider">Investable Balance</p>
                                            <div className="flex items-center gap-3">
                                                <div className="text-4xl font-bold text-white font-mono tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                                    {userBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 flex items-center gap-1.5">
                                                    <span className="text-sm font-bold text-white tracking-wider">MNT</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-400 font-medium mb-1 uppercase tracking-wider">Yield Earned</p>
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl font-bold text-primary font-mono tracking-tight">
                                                    {yieldBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                                                </div>
                                                <div className="px-2 py-1 rounded-lg bg-primary/20 border border-primary/50 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>forest</span>
                                                    <span className="text-[10px] font-bold text-primary tracking-wider">TREE</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleDepositClick}
                                            className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">add</span>
                                            Deposit
                                        </button>
                                        <button
                                            onClick={handleWithdrawClick}
                                            className="flex-1 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">arrow_outward</span>
                                            Withdraw
                                        </button>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <div className="flex justify-between items-center bg-black/40 rounded-xl p-3 border border-white/5">
                                            <div className="flex items-center gap-2">
                                                {chain.hasIcon && (
                                                    <div className="w-5 h-5 rounded-full overflow-hidden">
                                                        {chain.iconUrl && <img src={chain.iconUrl} alt={chain.name} className="w-full h-full" />}
                                                    </div>
                                                )}
                                                <span className="text-xs font-mono text-gray-400">{chain.name}</span>
                                            </div>
                                            <button onClick={openChainModal} className="text-xs text-primary hover:underline">Switch</button>
                                        </div>
                                    </div>
                                </>
                            );
                        }}
                    </ConnectButton.Custom>
                </div>

                <div className="glass rounded-3xl overflow-hidden border border-white/5 mb-6">
                    {[
                        { icon: 'settings', label: 'Account Settings' },
                        { icon: 'security', label: 'Security & 2FA' },
                        { icon: 'notifications', label: 'Notifications' },
                        { icon: 'help', label: 'Help & Support' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">{item.icon}</span>
                                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-600 text-sm">chevron_right</span>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <button className="text-red-500 text-sm font-bold hover:text-red-400 transition-colors">Sign Out</button>
                </div>
            </div>
        </div>
    );
}
