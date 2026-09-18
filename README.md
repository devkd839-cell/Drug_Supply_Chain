# DrugChain — Blockchain-Based Drug Supply Chain Management System

> **Secure. Transparent. Traceable.**
> Track every drug from Manufacturer → Wholesaler → Retailer → Customer using Ethereum smart contracts.

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Objectives](#objectives)
4. [Features](#features)
5. [Architecture](#architecture)
6. [Technology Stack](#technology-stack)
7. [Smart Contract](#smart-contract)
8. [Frontend](#frontend)
9. [Installation](#installation)
10. [Running Locally](#running-locally)
11. [MetaMask Setup](#metamask-setup)
12. [Contract Deployment](#contract-deployment)
13. [Seed Data](#seed-data)
14. [Sample Accounts](#sample-accounts)
15. [Complete Workflow Demo](#complete-workflow-demo)
16. [Testing](#testing)
17. [Project Structure](#project-structure)
18. [Future Improvements](#future-improvements)

---

## Overview

DrugChain is a **production-style decentralised application (DApp)** built on Ethereum.  
It uses a Solidity smart contract as the single source of truth for all pharmaceutical supply-chain transactions.  
The React frontend communicates with the contract through MetaMask and ethers.js.

---

## Problem Statement

Counterfeit and mishandled pharmaceuticals cause thousands of deaths annually.  
Traditional supply-chain databases are centralised, opaque, and easily tampered with.  
DrugChain solves this by recording every drug transfer immutably on the Ethereum blockchain.

---

## Objectives

- Provide **end-to-end traceability** for every drug batch.
- Enforce **role-based access** using smart-contract modifiers.
- Prevent **counterfeit drugs** from entering the supply chain.
- Allow **anyone** to verify a drug's authenticity using its Drug ID.
- Prevent **cross-entity stock manipulation** (a wholesaler cannot move another wholesaler's inventory).

---

## Features

| Feature | Description |
|---|---|
| Role-Based Access | Manufacturer, Wholesaler, Retailer, Customer, Admin |
| Drug Manufacturing | Create tracked drug batches with expiry dates |
| Supply Chain Transfers | On-chain transfers with ownership verification |
| Drug Verification | Public verification page — no wallet needed |
| Drug Tracking | Visual timeline of every transfer |
| Inventory Management | Per-wallet inventory with search and filters |
| Drug Recall | Manufacturer / admin can recall a batch |
| Admin Dashboard | Suspend/activate entities, manage drugs |
| Transaction History | Full on-chain transfer log |
| MetaMask Integration | Wallet auth + transaction signing |
| Charts | Recharts dashboards for each role |

---

## Architecture

```
React Frontend (Vite + Tailwind)
        ↓
    ethers.js v6
        ↓
    MetaMask
        ↓
DrugSupplyChain.sol (Solidity ^0.8.20)
        ↓
Hardhat Local Node / Sepolia Testnet
```

---

## Technology Stack

### Blockchain
| Tool | Version |
|---|---|
| Solidity | ^0.8.20 |
| Hardhat | ^2.22 |
| ethers.js | ^6.11 |
| MetaMask | Browser Extension |

### Frontend
| Library | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool |
| Tailwind CSS 3 | Styling |
| React Router 6 | Routing |
| ethers.js 6 | Blockchain interface |
| Framer Motion | Animations |
| Recharts | Dashboard charts |
| Lucide React | Icons |

---

## Smart Contract

**File:** `blockchain/contracts/DrugSupplyChain.sol`

### Key Design Decisions

- **Ownership-aware inventory**: `mapping(address => mapping(string => InventorySlot))` prevents any entity from accessing another entity's stock.
- **Role enum**: `None(0) | Manufacturer(1) | Wholesaler(2) | Retailer(3) | Customer(4)`
- **Security modifiers**: `onlyOwner`, `onlyRegistered`, `onlyRole`, `onlyActive`
- **Complete history**: Every transfer appends a `DrugTransaction` to `drugHistory[drugId]`
- **Recall/expiry enforcement**: Recalled or expired drugs cannot be transferred

### Main Functions

| Function | Caller | Description |
|---|---|---|
| `registerEntity` | Anyone | One-time registration |
| `manufactureDrug` | Manufacturer | Create a drug batch |
| `supplyToWholesaler` | Manufacturer | Transfer to wholesaler |
| `supplyToRetailer` | Wholesaler | Transfer to retailer |
| `supplyToCustomer` | Retailer | Transfer to customer |
| `verifyDrug` | Anyone | Full drug verification |
| `getDrugHistory` | Anyone | Complete supply history |
| `recallDrug` | Manufacturer / Admin | Recall a batch |
| `suspendEntity` | Admin | Suspend an entity |
| `activateEntity` | Admin | Reactivate an entity |

---

## Frontend

**Directory:** `frontend/src/`

| Page | Route | Access |
|---|---|---|
| Landing | `/` | Public |
| Connect Wallet | `/connect` | Public |
| Register | `/register` | Wallet required |
| Manufacturer Dashboard | `/manufacturer` | Manufacturer role |
| Wholesaler Dashboard | `/wholesaler` | Wholesaler role |
| Retailer Dashboard | `/retailer` | Retailer role |
| Customer Dashboard | `/customer` | Customer role |
| Drug Verification | `/verify` | Public |
| Drug Tracking | `/track` | Public |
| Admin Dashboard | `/admin` | Registered user |

---

## Installation

### Prerequisites

- Node.js v18+
- npm v9+
- MetaMask browser extension

### Clone / Navigate

```bash
cd drugchain
```

### Install blockchain dependencies

```bash
cd blockchain
npm install
```

### Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running Locally

### Step 1 — Start the Hardhat node

Open a **dedicated terminal** and keep it running:

```bash
cd blockchain
npx hardhat node
```

This prints 20 test accounts with private keys. **Copy the first 5 private keys** — you will import them into MetaMask.

### Step 2 — Deploy the smart contract

Open a **second terminal**:

```bash
cd blockchain
npm run deploy
```

This prints the contract address and writes it to:
- `frontend/src/blockchain/deployments.json`
- `frontend/public/deployments.json`

### Step 3 — (Optional) Load seed data

```bash
cd blockchain
npm run seed
```

This registers M11 / W11 / R11 / C11 and runs the full supply chain for drug D101.

### Step 4 — Start the frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## MetaMask Setup

1. Install MetaMask from https://metamask.io
2. Add a custom network:
   - **Network name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency symbol**: `ETH`
3. Import test accounts using the private keys printed by `npx hardhat node`.

> ⚠️ Never use Hardhat test accounts on mainnet. They are publicly known and have no real value.

---

## Contract Deployment

### Localhost (development)

```bash
cd blockchain
npm run deploy
```

### Sepolia testnet

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your values:
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   ```
3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
4. Update `frontend/.env`:
   ```
   VITE_CONTRACT_ADDRESS=0xDEPLOYED_ADDRESS
   VITE_NETWORK=sepolia
   VITE_CHAIN_ID=11155111
   ```

---

## Seed Data

After deployment, run the seed script to populate sample data:

```bash
cd blockchain
npm run seed
```

This creates:

| Entity | ID | Role |
|---|---|---|
| ABC Pharma | M11 | Manufacturer |
| XYZ Distribution | W11 | Wholesaler |
| City Pharmacy | R11 | Retailer |
| John | C11 | Customer |

And runs this supply chain:
```
D101 Paracetamol (1000 lots)
  M11 → W11: 400 lots
  M11 → W11: 200 lots (D102 Amoxicillin)
  W11 → R11: 200 lots
  R11 → C11:  20 lots
```

---

## Sample Accounts

After `npx hardhat node`, the accounts map as follows:

| Index | Role | Entity |
|---|---|---|
| 0 | Admin / Contract Owner | — |
| 1 | Manufacturer | ABC Pharma (M11) |
| 2 | Wholesaler | XYZ Distribution (W11) |
| 3 | Retailer | City Pharmacy (R11) |
| 4 | Customer | John (C11) |

Import private keys from the Hardhat node output into MetaMask.

---

## Complete Workflow Demo

```
1. Switch MetaMask to account [1]  →  Connect wallet  →  Register as Manufacturer / ABC Pharma / M11
2. Switch to account [2]           →  Connect wallet  →  Register as Wholesaler / XYZ Distribution / W11
3. Switch to account [3]           →  Connect wallet  →  Register as Retailer / City Pharmacy / R11
4. Switch to account [4]           →  Connect wallet  →  Register as Customer / John / C11

5. Switch to account [1]  →  Manufacturer Dashboard
   →  Manufacture Drug: Paracetamol / D101 / 1000 lots
   →  Supply to Wholesaler: D101 / W11 / 400 lots

6. Switch to account [2]  →  Wholesaler Dashboard
   →  See 400 lots of D101 in inventory
   →  Supply to Retailer: D101 / R11 / 200 lots

7. Switch to account [3]  →  Retailer Dashboard
   →  See 200 lots of D101
   →  Supply to Customer: D101 / C11 / 20 lots

8. Switch to account [4]  →  Customer Dashboard
   →  See Paracetamol D101 — 20 lots

9. Go to /verify  →  Enter D101
   →  See complete blockchain-verified history: M11 → W11 → R11 → C11
```

---

## Testing

```bash
cd blockchain
npx hardhat test
```

**71 tests** covering:
- Entity registration, duplicates, role validation
- Drug manufacturing, duplicate prevention
- Supply chain (Manufacturer → Wholesaler → Retailer → Customer)
- Insufficient stock checks
- Unauthorized transfer prevention
- Expired drug transfer prevention
- Recalled drug transfer prevention
- Drug history and customer inventory
- Entity suspension / activation
- Drug verification

---

## Project Structure

```
drugchain/
├── blockchain/
│   ├── contracts/
│   │   └── DrugSupplyChain.sol      ← Smart contract
│   ├── scripts/
│   │   ├── deploy.js                ← Deployment script
│   │   └── seed.js                  ← Sample data script
│   ├── test/
│   │   └── DrugSupplyChain.js       ← 71 tests
│   ├── hardhat.config.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── deployments.json         ← Written by deploy.js
│   ├── src/
│   │   ├── blockchain/
│   │   │   ├── abi.js               ← Full contract ABI
│   │   │   └── contract.js          ← All blockchain helpers
│   │   ├── components/              ← Reusable UI components
│   │   ├── context/
│   │   │   └── Web3Context.jsx      ← Global wallet state
│   │   ├── hooks/
│   │   │   ├── useTransaction.js    ← Write transaction helper
│   │   │   └── useContractData.js   ← Read data helper
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── PublicLayout.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ConnectWallet.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ManufacturerDashboard.jsx
│   │   │   ├── WholesalerDashboard.jsx
│   │   │   ├── RetailerDashboard.jsx
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── DrugVerification.jsx
│   │   │   ├── DrugTracking.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── utils/
│   │   │   └── helpers.js           ← Formatters, normalizers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Future Improvements

- **IPFS integration** — store drug batch documents / certificates off-chain
- **QR code generation** — each drug batch gets a scannable QR pointing to its verification page
- **Sepolia / Mainnet deployment** — production-ready network deployment
- **Multi-signature recalls** — require N-of-M approval for recalls
- **Batch transfers** — supply multiple drugs in a single transaction
- **Notifications** — real-time event listeners via WebSocket provider
- **Mobile app** — React Native client using the same contract layer
- **NFT-based drug certificates** — ERC-721 tokens representing verified drug batches
