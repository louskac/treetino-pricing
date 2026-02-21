"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useSendTransaction } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { TREE_TOKEN_ADDRESS, TREE_TOKEN_ABI, TREE_VAULT_ADDRESS, TREE_VAULT_ABI } from '../config/contracts';

export type AssetStatus = 'OPEN' | 'CONSTRUCTED' | 'LIVE';

export interface VerificationData {
    timestamp: number;
    txHash: string;
    blockNumber: number;
    values: {
        solarW: number;
        battery: number;
    };
}

export interface Asset {
    id: number;
    name: string;
    location: string;
    type: 'Solar Tree' | 'Wind Tree' | 'Hybrid Tree';
    yieldApy: string;
    price: number; // Price per unit/share
    color: string;
    status: AssetStatus;

    // Fundraising State
    raisedAmount: number;
    targetAmount: number;

    // Construction State (0-100)
    constructionProgress: number;

    // Live State
    dailyRevenue: number;
    totalProductionKwh: number;
    nominalPower: number; // Max kW output per unit

    // Real-time Telemetry (Simulated)
    currentWattage: number;
    voltage: number;
    batteryLevel?: number;

    // On-Chain Verification
    verification?: VerificationData;
}

export interface UserInvestment {
    assetId: number;
    shareCount: number; // For this demo, let's treat this as "Units Owned"
    investedAt: Date;
}

interface TreeContextType {
    // Global aggregates
    totalPortfolioValue: number;
    totalDailyRevenue: number;

    // Balances
    userBalance: number; // MNT (Investable Principal)
    yieldBalance: number; // TREE (Earned Yield from Contract)

    // Actions
    depositMnt: (amount: number) => void;
    withdrawMnt: (amount: number) => void;

    // EV Charging global state (could be per-asset later, keeping global for simplicity/demo)
    isEVCharging: boolean;
    toggleEV: () => void;

    // Assets
    assets: Asset[];
    userInvestments: UserInvestment[];
    investInAsset: (assetId: number, amount: number) => void;
    getAssetById: (id: number) => Asset | undefined;
}

// Helper to init assets
const INITIAL_ASSETS: Asset[] = [
    {
        id: 1,
        name: 'Treetino Unit [Prague]',
        location: 'Prague, CZ',
        yieldApy: '15% APY',
        price: 950,
        type: 'Solar Tree',
        color: 'from-yellow-400 to-orange-500',
        status: 'LIVE',
        raisedAmount: 50000,
        targetAmount: 50000,
        constructionProgress: 100,
        dailyRevenue: 12.5,
        totalProductionKwh: 4500,
        nominalPower: 5.5, // kW
        currentWattage: 4200,
        voltage: 48.2,
        batteryLevel: 87.0,
        verification: {
            timestamp: 1704067200000,
            txHash: '0x712903...',
            blockNumber: 33384632,
            values: { solarW: 4200, battery: 87 }
        }
    },
    {
        id: 2,
        name: 'Treetino Unit [Berlin]',
        location: 'Berlin, DE',
        yieldApy: '12.5% APY',
        price: 1200,
        type: 'Wind Tree',
        color: 'from-blue-400 to-cyan-500',
        status: 'OPEN',
        raisedAmount: 15400,
        targetAmount: 120000,
        constructionProgress: 0,
        dailyRevenue: 0, // Not live
        totalProductionKwh: 0,
        nominalPower: 4.2,
        currentWattage: 0,
        voltage: 0
    },
];

export const TreeContext = createContext<TreeContextType>({} as TreeContextType);

// Mock initial investments so the user sees SOMETHING at start (e.g. 1 unit of Prague)
const INITIAL_INVESTMENTS: UserInvestment[] = [
    { assetId: 1, shareCount: 1, investedAt: new Date(1704067200000) }
];

export const TreeProvider = ({ children }: { children: React.ReactNode }) => {
    // State
    const [mntBalance, setMntBalance] = useState(24500); // Investable MNT (Principal)
    const [treeBalance, setTreeBalance] = useState(0); // Yield (TREE Tokens)
    const [evMode, setEvMode] = useState(false);

    const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
    const [userInvestments, setUserInvestments] = useState<UserInvestment[]>(INITIAL_INVESTMENTS);

    const { address, isConnected } = useAccount();

    const { data: mntBalanceData } = useBalance({ address });

    // TREE Token (Yield) Balance
    const { data: treeTokenData } = useReadContract({
        address: TREE_TOKEN_ADDRESS,
        abi: TREE_TOKEN_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 3000,
        }
    });

    useEffect(() => {
        if (isConnected && treeTokenData !== undefined) {
            const val = formatUnits(treeTokenData as bigint, 18);
            setTreeBalance(parseFloat(val));
        }
    }, [isConnected, treeTokenData]);

    // Sync MNT Balance from Wallet
    useEffect(() => {
        if (isConnected && mntBalanceData) {
            const val = formatUnits(mntBalanceData.value, mntBalanceData.decimals);
            setMntBalance(parseFloat(val));
        }
    }, [isConnected, mntBalanceData]);

    // Helpers
    const depositMnt = (amount: number) => setMntBalance(prev => prev + amount);
    const withdrawMnt = (amount: number) => setMntBalance(prev => Math.max(0, prev - amount));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://treetino-victronenergy.up.railway.app/api/status');
                const data = await res.json();

                setAssets(prevAssets => prevAssets.map(asset => {
                    if (asset.id === 1 && asset.status === 'LIVE') {
                        let verification = asset.verification;
                        const now = Date.now();
                        const timeSinceLastVerify = now - (verification?.timestamp || 0);

                        if (timeSinceLastVerify > 15 * 60 * 1000) {
                            verification = {
                                timestamp: now,
                                txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
                                blockNumber: (verification?.blockNumber || 33384632) + 1,
                                values: {
                                    solarW: data.solarW,
                                    battery: data.soc
                                }
                            };
                        }

                        return {
                            ...asset,
                            currentWattage: data.solarW,
                            batteryLevel: data.soc,
                            voltage: 48.0,
                            totalProductionKwh: asset.totalProductionKwh + (data.solarW / 3600),
                            verification
                        };
                    }
                    return asset;
                }));

                // TREE Token Yield Generation (Based on Ownership)
                // Only generate yield for users who own shares in LIVE assets
                if (!isConnected) {
                    // Calculate yield for each LIVE asset the user owns
                    let totalYieldThisCycle = 0;

                    userInvestments.forEach(investment => {
                        const asset = assets.find(a => a.id === investment.assetId);
                        if (asset && asset.status === 'LIVE') {
                            // Yield per share = (asset's current production * yield rate) / total shares
                            // For simplicity, assume each asset has 100 total shares available
                            const totalShares = asset.targetAmount / asset.price;
                            const userSharePercentage = investment.shareCount / totalShares;

                            // Generate TREE tokens based on energy production and ownership
                            const assetYieldThisCycle = (asset.currentWattage * 0.005); // Base yield from energy
                            const userYieldFromAsset = assetYieldThisCycle * userSharePercentage;

                            totalYieldThisCycle += userYieldFromAsset;
                        }
                    });

                    if (totalYieldThisCycle > 0) {
                        setTreeBalance(prev => +(prev + totalYieldThisCycle).toFixed(4));
                    }

                    // EV Cost (operational expense, paid in MNT)
                    const evCost = evMode ? 0.05 : 0;
                    if (evCost > 0) {
                        setMntBalance(prev => +(prev - evCost).toFixed(4));
                    }
                }

            } catch (err) {
                console.error("Failed to fetch live status:", err);
            }
        };

        const timer = setInterval(fetchData, 2000);
        fetchData();

        return () => clearInterval(timer);
    }, [evMode, isConnected, userInvestments, assets]);

    const { writeContract } = useWriteContract();

    const investInAsset = (assetId: number, amount: number) => {
        // Check MNT Balance
        if (amount > mntBalance) {
            alert("Insufficient MNT Balance. Please Deposit funds.");
            return;
        }

        const assetIndex = assets.findIndex(a => a.id === assetId);
        if (assetIndex === -1) return;
        const asset = assets[assetIndex];

        if (asset.status !== 'OPEN') {
            alert("This asset is no longer open for investment.");
            return;
        }

        // If connected, we enforce on-chain transaction
        if (isConnected) {
            try {
                writeContract({
                    address: TREE_VAULT_ADDRESS,
                    abi: TREE_VAULT_ABI,
                    functionName: 'deposit',
                    value: parseUnits(amount.toString(), 18), // MNT uses 18 decimals
                    args: [],
                });
            } catch (err) {
                console.error("Investment Transaction Failed:", err);
                return; // Don't update UI if tx fails
            }
        } else {
            alert("Please connect your wallet to invest!");
            return;
        }

        // Optimistic State Updates (So UI shows change immediately)
        setMntBalance(prev => prev - amount);

        // Convert MNT investment to USD for tracking raised amount
        // Rate: 1 MNT = $10,000
        const MNT_PRICE_USD = 10000;
        const investmentInUsd = amount * MNT_PRICE_USD;

        const newRaised = Math.min(asset.raisedAmount + investmentInUsd, asset.targetAmount);
        const newStatus = newRaised >= asset.targetAmount ? 'CONSTRUCTED' : 'OPEN';

        const updatedAssets = [...assets];
        updatedAssets[assetIndex] = {
            ...asset,
            raisedAmount: newRaised,
            status: newStatus as AssetStatus
        };
        setAssets(updatedAssets);

        // Shares calculation (Units) - based on USD price
        const units = investmentInUsd / asset.price;

        setUserInvestments(prev => {
            const existing = prev.find(i => i.assetId === assetId);
            if (existing) {
                return prev.map(i => i.assetId === assetId
                    ? { ...i, shareCount: i.shareCount + units }
                    : i
                );
            } else {
                return [...prev, { assetId, shareCount: units, investedAt: new Date() }];
            }
        });
    };

    const getAssetById = (id: number) => assets.find(a => a.id === id);

    const totalPortfolioValue = userInvestments.reduce((acc, inv) => {
        const asset = assets.find(a => a.id === inv.assetId);
        return acc + (inv.shareCount * (asset?.price || 0));
    }, 0);

    const totalDailyRevenue = assets.reduce((acc, a) => acc + a.dailyRevenue, 0); // Mock for now

    return (
        <TreeContext.Provider value={{
            totalPortfolioValue,
            totalDailyRevenue,
            userBalance: mntBalance,
            yieldBalance: treeBalance,
            depositMnt,
            withdrawMnt,
            isEVCharging: evMode,
            toggleEV: () => setEvMode(!evMode),
            assets,
            userInvestments,
            investInAsset,
            getAssetById
        }}>
            {children}
        </TreeContext.Provider>
    );
};