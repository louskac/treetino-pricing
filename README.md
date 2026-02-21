# 🌳 Treetino - RWA Energy Platform

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://treetino-app.vercel.app/)
[![Mantle Testnet](https://img.shields.io/badge/network-Mantle%20Sepolia-blue)](https://explorer.testnet.mantle.xyz/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> **Tokenizing the energy market, one tree at a time.**

Treetino is a Real World Asset (RWA) platform that bridges renewable energy infrastructure with blockchain technology. Built on Mantle Testnet, it allows users to invest in tokenized solar and wind power plants, earn yields from energy production, and monitor real-time performance through an immersive Web3 interface.

🔗 **[Live Demo](https://treetino-app.vercel.app/)** | 📄 **[Whitepaper](https://treetino.eu/whitepaper.pdf)**

---

## 🎯 Project Overview

Treetino transforms renewable energy assets into investable, yield-generating tokens. Our platform enables:

- **Fractional Ownership**: Invest in solar/wind power plants with MNT tokens
- **Passive Yields**: Earn TREE tokens based on real energy production
- **Real-Time Monitoring**: Track live telemetry from actual hardware
- **On-Chain Verification**: Immutable proof of energy data via oracle

---

## 🏗️ Hackathon Prototype

### Physical Hardware

During the **Mantle Hackathon**, we built a functional prototype consisting of:

- **4 Solar Panels** with 3D-printed leaf coverings for aesthetic appeal
- **Victron Energy Components**:
  - Multiplus Inverter
  - Cerbo GX Controller
  - MPPT Transmitter
- **Car Battery** for energy storage
- **3 Lightbulbs**:
  - 2 standard bulbs simulating energy buyers
  - 1 smart bulb for EV charging simulation

### Data Flow

```
Solar Panels → Victron Hardware → Node-RED (Backend) → Blockchain Oracle → Frontend DApp
```

The prototype communicates through Victron's software stack, processed via Node-RED (typical for IoT projects), and verified on-chain every 15 minutes.

---

## 🚀 Features

### For Investors
- **Browse Marketplace**: Discover available RWA energy assets
- **Invest with MNT**: Purchase fractional shares in power plants
- **Earn TREE Tokens**: Passive yield generation from energy production
- **Real-Time Dashboard**: Monitor your portfolio and asset performance
- **Wallet Integration**: Full Web3 wallet support via RainbowKit

### For Asset Monitoring
- **Live Telemetry**: Real-time power output, voltage, and battery levels
- **On-Chain Verification**: Cryptographic proof of data integrity
- **EV Charging Simulation**: 3x yield multiplier for high-demand scenarios
- **Asset Lifecycle Tracking**: From fundraising → construction → live operation

---

## 🔗 Smart Contracts (Mantle Sepolia Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **TREE Token** | [`0x611D4F6154d853A71D5d0da7b92fDe3505A1656E`](https://explorer.testnet.mantle.xyz/address/0x611D4F6154d853A71D5d0da7b92fDe3505A1656E) | ERC-20 yield token (1M supply) |
| **Vault** | [`0xC7803f05c3ff7857990396E2e84bc8Ccd258c2BA`](https://explorer.testnet.mantle.xyz/address/0xC7803f05c3ff7857990396E2e84bc8Ccd258c2BA) | MNT ↔ TREE conversion mechanism |
| **Oracle** | [`0xdd97208BD0CB9E79BC90fc32E9e7AAc78a93Dd44`](https://explorer.testnet.mantle.xyz/address/0xdd97208BD0CB9E79BC90fc32E9e7AAc78a93Dd44) | Data verification & immutable storage |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Web3**: Wagmi v3 + RainbowKit + Viem
- **State**: React Context API
- **Font**: Space Grotesk

### Blockchain
- **Network**: Mantle Sepolia Testnet
- **Wallet**: MetaMask, WalletConnect, Coinbase Wallet
- **Contracts**: Solidity (ERC-20, Vault, Oracle)

### Design
- **Theme**: Cyberpunk/Eco-Futurism
- **Style**: Glassmorphism with neon accents
- **Colors**: Deep dark (#050B14) + Neon cyan (#00E0FF) + Neon green (#39FF14)

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/pnpm
- MetaMask or compatible Web3 wallet
- Mantle Sepolia testnet MNT tokens ([Faucet](https://faucet.testnet.mantle.xyz/))

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/treetino-app.git
cd treetino-app

# Install dependencies
npm install
# or
pnpm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Setup

The app is pre-configured for Mantle Sepolia Testnet. To customize:

1. Update `src/config/wagmi.ts` with your WalletConnect Project ID
2. Modify contract addresses in `src/config/contracts.ts` if needed

---

## 🎮 Usage

### 1. Connect Wallet
Navigate to the **Profile** page and connect your Web3 wallet to Mantle Sepolia Testnet.

### 2. Deposit Funds
Deposit MNT tokens to your investable balance (1 MNT = $10,000 USD in demo).

### 3. Invest in Assets
Browse the **Marketplace**, select an asset, and invest MNT to purchase shares.

### 4. Earn Yields
Once assets go **LIVE**, you'll automatically earn TREE tokens based on:
- Your ownership percentage
- Real-time energy production
- Asset performance

### 5. Monitor Performance
View individual asset details to see:
- Live power gauge
- Real-time telemetry (voltage, current, yield)
- On-chain verification status
- EV charging simulation

---

## 📊 Token Economics

### MNT (Mantle Token)
- **Purpose**: Principal investment currency
- **Use**: Purchase asset shares
- **Rate**: 1 MNT = $10,000 USD (demo rate)

### TREE Token
- **Purpose**: Yield rewards
- **Generation**: Based on energy production × ownership %
- **Formula**: `(currentWattage * 0.005) * userSharePercentage`
- **Supply**: 1,000,000 TREE (testnet)

---

## 🏛️ Asset Lifecycle

Assets progress through three states:

1. **OPEN (Fundraising)**
   - Users invest MNT to purchase shares
   - Progress tracked toward funding goal
   - Transitions when target reached

2. **CONSTRUCTED (Building)**
   - Construction progress simulation
   - No yield generation
   - ~2 week completion estimate

3. **LIVE (Operational)**
   - Real-time energy production
   - TREE token yield generation
   - On-chain verification active
   - EV charging available

---

## 🔐 Security & Verification

### On-Chain Oracle
Every 15 minutes, our backend imprints telemetry data to the blockchain:
- Solar power output (watts)
- Battery state of charge (%)
- Timestamp & block number
- Transaction hash for verification

### Data Integrity
The frontend compares live data with on-chain records, displaying:
- ✅ **VERIFIED**: Data matches blockchain
- ⚠️ **DIVERGENCE**: Discrepancy detected (prioritizes on-chain data)

---

## 🗺️ Roadmap

This hackathon prototype serves as the foundation for Artiffine's full RWA energy platform. Future development includes:

- [ ] Multi-asset portfolio management
- [ ] Secondary market for TREE tokens
- [ ] Advanced yield strategies
- [ ] Real-world deployment partnerships
- [ ] Mainnet launch on Mantle
- [ ] Mobile app (iOS/Android)
- [ ] DAO governance for asset selection

See our **[Whitepaper](https://treetino.eu/whitepaper.pdf)** for the complete vision.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Mantle Network** for hackathon support and testnet infrastructure
- **Victron Energy** for IoT hardware and software stack
- **RainbowKit** for seamless wallet integration
- **Vercel** for deployment platform

---

## 📞 Contact

- **Website**: [treetino.eu](https://treetino.eu)
- **Demo**: [treetino-app.vercel.app](https://treetino-app.vercel.app/)
- **Whitepaper**: [treetino.eu/whitepaper.pdf](https://treetino.eu/whitepaper.pdf)

---

<div align="center">
  <strong>Built with 💚 for a sustainable, tokenized energy future</strong>
</div>
