/**
 * DrugSupplyChain ABI
 * Auto-generated from compiled contract artifacts.
 * Keep this in sync with blockchain/artifacts/contracts/DrugSupplyChain.sol/DrugSupplyChain.json
 */
export const ABI = [
  // ── Constructor ──────────────────────────────────────────────────────────
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },

  // ── Events ───────────────────────────────────────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "wallet",  "type": "address" },
      { "indexed": false, "internalType": "string",  "name": "id",      "type": "string"  },
      { "indexed": false, "internalType": "uint8",   "name": "role",    "type": "uint8"   },
      { "indexed": false, "internalType": "string",  "name": "name",    "type": "string"  }
    ],
    "name": "EntityRegistered", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string",  "name": "id",     "type": "string"  },
      { "indexed": true,  "internalType": "address", "name": "wallet", "type": "address" }
    ],
    "name": "EntitySuspended", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string",  "name": "id",     "type": "string"  },
      { "indexed": true,  "internalType": "address", "name": "wallet", "type": "address" }
    ],
    "name": "EntityActivated", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "drugId",         "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "drugName",       "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "manufacturerId", "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "quantity",       "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "expiryDate",     "type": "uint256" }
    ],
    "name": "DrugManufactured", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "drugId",           "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "fromManufacturerId","type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "toWholesalerId",   "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "quantity",         "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",        "type": "uint256" }
    ],
    "name": "SuppliedToWholesaler", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "drugId",          "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "fromWholesalerId","type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "toRetailerId",    "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "quantity",        "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",       "type": "uint256" }
    ],
    "name": "SuppliedToRetailer", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "drugId",        "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "fromRetailerId","type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "toCustomerId",  "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "quantity",      "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",     "type": "uint256" }
    ],
    "name": "SuppliedToCustomer", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "drugId",    "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "reason",    "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "DrugRecalled", "type": "event"
  },

  // ── State variables ───────────────────────────────────────────────────────
  {
    "inputs": [], "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view", "type": "function"
  },

  // ── Entity management ────────────────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_id",   "type": "string" },
      { "internalType": "uint8",  "name": "_role",  "type": "uint8"  }
    ],
    "name": "registerEntity",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_id", "type": "string" }],
    "name": "suspendEntity",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_id", "type": "string" }],
    "name": "activateEntity",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },

  // ── Entity queries ───────────────────────────────────────────────────────
  {
    "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }],
    "name": "getEntityByWallet",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "name",         "type": "string"  },
        { "internalType": "string",  "name": "id",           "type": "string"  },
        { "internalType": "uint8",   "name": "role",         "type": "uint8"   },
        { "internalType": "address", "name": "wallet",       "type": "address" },
        { "internalType": "bool",    "name": "isRegistered", "type": "bool"    },
        { "internalType": "bool",    "name": "isActive",     "type": "bool"    },
        { "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.Entity", "name": "", "type": "tuple"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_id", "type": "string" }],
    "name": "getEntityById",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "name",         "type": "string"  },
        { "internalType": "string",  "name": "id",           "type": "string"  },
        { "internalType": "uint8",   "name": "role",         "type": "uint8"   },
        { "internalType": "address", "name": "wallet",       "type": "address" },
        { "internalType": "bool",    "name": "isRegistered", "type": "bool"    },
        { "internalType": "bool",    "name": "isActive",     "type": "bool"    },
        { "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.Entity", "name": "", "type": "tuple"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }],
    "name": "isEntityRegistered",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllEntities",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "name",         "type": "string"  },
        { "internalType": "string",  "name": "id",           "type": "string"  },
        { "internalType": "uint8",   "name": "role",         "type": "uint8"   },
        { "internalType": "address", "name": "wallet",       "type": "address" },
        { "internalType": "bool",    "name": "isRegistered", "type": "bool"    },
        { "internalType": "bool",    "name": "isActive",     "type": "bool"    },
        { "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.Entity[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint8", "name": "_role", "type": "uint8" }],
    "name": "getEntitiesByRole",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "name",         "type": "string"  },
        { "internalType": "string",  "name": "id",           "type": "string"  },
        { "internalType": "uint8",   "name": "role",         "type": "uint8"   },
        { "internalType": "address", "name": "wallet",       "type": "address" },
        { "internalType": "bool",    "name": "isRegistered", "type": "bool"    },
        { "internalType": "bool",    "name": "isActive",     "type": "bool"    },
        { "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.Entity[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },

  // ── Drug manufacturing ───────────────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string",  "name": "_drugName",         "type": "string"  },
      { "internalType": "string",  "name": "_drugId",           "type": "string"  },
      { "internalType": "uint256", "name": "_quantity",         "type": "uint256" },
      { "internalType": "uint256", "name": "_manufacturingDate","type": "uint256" },
      { "internalType": "uint256", "name": "_expiryDate",       "type": "uint256" }
    ],
    "name": "manufactureDrug",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },

  // ── Supply chain ─────────────────────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string",  "name": "_drugId",       "type": "string"  },
      { "internalType": "string",  "name": "_wholesalerId", "type": "string"  },
      { "internalType": "uint256", "name": "_quantity",     "type": "uint256" }
    ],
    "name": "supplyToWholesaler",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string",  "name": "_drugId",     "type": "string"  },
      { "internalType": "string",  "name": "_retailerId", "type": "string"  },
      { "internalType": "uint256", "name": "_quantity",   "type": "uint256" }
    ],
    "name": "supplyToRetailer",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string",  "name": "_drugId",     "type": "string"  },
      { "internalType": "string",  "name": "_customerId", "type": "string"  },
      { "internalType": "uint256", "name": "_quantity",   "type": "uint256" }
    ],
    "name": "supplyToCustomer",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },

  // ── Drug status & recall ─────────────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "_drugId", "type": "string" },
      { "internalType": "string", "name": "_reason", "type": "string" }
    ],
    "name": "recallDrug",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_drugId", "type": "string" }],
    "name": "isDrugExpired",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_drugId", "type": "string" }],
    "name": "getDrugStatus",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view", "type": "function"
  },

  // ── Drug queries ─────────────────────────────────────────────────────────
  {
    "inputs": [{ "internalType": "string", "name": "_drugId", "type": "string" }],
    "name": "getDrug",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugName",          "type": "string"  },
        { "internalType": "string",  "name": "drugId",            "type": "string"  },
        { "internalType": "string",  "name": "manufacturerId",    "type": "string"  },
        { "internalType": "address", "name": "manufacturerWallet","type": "address" },
        { "internalType": "uint256", "name": "manufacturedQty",   "type": "uint256" },
        { "internalType": "uint256", "name": "remainingQty",      "type": "uint256" },
        { "internalType": "uint256", "name": "manufacturingDate", "type": "uint256" },
        { "internalType": "uint256", "name": "expiryDate",        "type": "uint256" },
        { "internalType": "bool",    "name": "isRecalled",        "type": "bool"    },
        { "internalType": "string",  "name": "recallReason",      "type": "string"  },
        { "internalType": "bool",    "name": "exists",            "type": "bool"    },
        { "internalType": "uint256", "name": "createdAt",         "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.DrugBatch", "name": "", "type": "tuple"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllDrugs",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugName",          "type": "string"  },
        { "internalType": "string",  "name": "drugId",            "type": "string"  },
        { "internalType": "string",  "name": "manufacturerId",    "type": "string"  },
        { "internalType": "address", "name": "manufacturerWallet","type": "address" },
        { "internalType": "uint256", "name": "manufacturedQty",   "type": "uint256" },
        { "internalType": "uint256", "name": "remainingQty",      "type": "uint256" },
        { "internalType": "uint256", "name": "manufacturingDate", "type": "uint256" },
        { "internalType": "uint256", "name": "expiryDate",        "type": "uint256" },
        { "internalType": "bool",    "name": "isRecalled",        "type": "bool"    },
        { "internalType": "string",  "name": "recallReason",      "type": "string"  },
        { "internalType": "bool",    "name": "exists",            "type": "bool"    },
        { "internalType": "uint256", "name": "createdAt",         "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.DrugBatch[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "getDrugCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view", "type": "function"
  },

  // ── Drug verification ────────────────────────────────────────────────────
  {
    "inputs": [{ "internalType": "string", "name": "_drugId", "type": "string" }],
    "name": "verifyDrug",
    "outputs": [{
      "components": [
        { "internalType": "bool",    "name": "exists",             "type": "bool"    },
        { "internalType": "string",  "name": "drugName",           "type": "string"  },
        { "internalType": "string",  "name": "manufacturerId",     "type": "string"  },
        { "internalType": "address", "name": "manufacturerWallet", "type": "address" },
        { "internalType": "uint256", "name": "manufacturingDate",  "type": "uint256" },
        { "internalType": "uint256", "name": "expiryDate",         "type": "uint256" },
        { "internalType": "bool",    "name": "isExpired",          "type": "bool"    },
        { "internalType": "bool",    "name": "isRecalled",         "type": "bool"    },
        { "internalType": "string",  "name": "recallReason",       "type": "string"  },
        { "internalType": "uint256", "name": "manufacturedQty",    "type": "uint256" },
        { "internalType": "uint256", "name": "remainingQty",       "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.VerifyResult", "name": "result", "type": "tuple"
    }],
    "stateMutability": "view", "type": "function"
  },

  // ── Inventory queries ────────────────────────────────────────────────────
  {
    "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }],
    "name": "getManufacturerInventory",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugName",          "type": "string"  },
        { "internalType": "string",  "name": "drugId",            "type": "string"  },
        { "internalType": "string",  "name": "manufacturerId",    "type": "string"  },
        { "internalType": "address", "name": "manufacturerWallet","type": "address" },
        { "internalType": "uint256", "name": "manufacturedQty",   "type": "uint256" },
        { "internalType": "uint256", "name": "remainingQty",      "type": "uint256" },
        { "internalType": "uint256", "name": "manufacturingDate", "type": "uint256" },
        { "internalType": "uint256", "name": "expiryDate",        "type": "uint256" },
        { "internalType": "bool",    "name": "isRecalled",        "type": "bool"    },
        { "internalType": "string",  "name": "recallReason",      "type": "string"  },
        { "internalType": "bool",    "name": "exists",            "type": "bool"    },
        { "internalType": "uint256", "name": "createdAt",         "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.DrugBatch[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }],
    "name": "getWholesalerInventory",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugId",       "type": "string"  },
        { "internalType": "string",  "name": "drugName",     "type": "string"  },
        { "internalType": "uint256", "name": "receivedQty",  "type": "uint256" },
        { "internalType": "uint256", "name": "availableQty", "type": "uint256" },
        { "internalType": "uint256", "name": "suppliedQty",  "type": "uint256" },
        { "internalType": "bool",    "name": "exists",       "type": "bool"    }
      ],
      "internalType": "struct DrugSupplyChain.InventorySlot[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }],
    "name": "getRetailerInventory",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugId",       "type": "string"  },
        { "internalType": "string",  "name": "drugName",     "type": "string"  },
        { "internalType": "uint256", "name": "receivedQty",  "type": "uint256" },
        { "internalType": "uint256", "name": "availableQty", "type": "uint256" },
        { "internalType": "uint256", "name": "suppliedQty",  "type": "uint256" },
        { "internalType": "bool",    "name": "exists",       "type": "bool"    }
      ],
      "internalType": "struct DrugSupplyChain.InventorySlot[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_customerId", "type": "string" }],
    "name": "getCustomerInventory",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugId",         "type": "string"  },
        { "internalType": "string",  "name": "drugName",       "type": "string"  },
        { "internalType": "uint256", "name": "quantity",       "type": "uint256" },
        { "internalType": "string",  "name": "fromRetailerId", "type": "string"  },
        { "internalType": "uint256", "name": "receivedAt",     "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.CustomerDrug[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_customerId", "type": "string" }],
    "name": "getCustomerDrugCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string",  "name": "_customerId", "type": "string" },
      { "internalType": "uint256", "name": "_index",      "type": "uint256" }
    ],
    "name": "getCustomerDrug",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugId",         "type": "string"  },
        { "internalType": "string",  "name": "drugName",       "type": "string"  },
        { "internalType": "uint256", "name": "quantity",       "type": "uint256" },
        { "internalType": "string",  "name": "fromRetailerId", "type": "string"  },
        { "internalType": "uint256", "name": "receivedAt",     "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.CustomerDrug", "name": "", "type": "tuple"
    }],
    "stateMutability": "view", "type": "function"
  },

  // ── Drug history ─────────────────────────────────────────────────────────
  {
    "inputs": [{ "internalType": "string", "name": "_drugId", "type": "string" }],
    "name": "getDrugHistory",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugId",     "type": "string"  },
        { "internalType": "string",  "name": "fromId",     "type": "string"  },
        { "internalType": "string",  "name": "toId",       "type": "string"  },
        { "internalType": "uint8",   "name": "fromRole",   "type": "uint8"   },
        { "internalType": "uint8",   "name": "toRole",     "type": "uint8"   },
        { "internalType": "uint256", "name": "quantity",   "type": "uint256" },
        { "internalType": "uint256", "name": "timestamp",  "type": "uint256" },
        { "internalType": "address", "name": "fromWallet", "type": "address" },
        { "internalType": "address", "name": "toWallet",   "type": "address" }
      ],
      "internalType": "struct DrugSupplyChain.DrugTransaction[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_drugId", "type": "string" }],
    "name": "getDrugHistoryCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string",  "name": "_drugId", "type": "string" },
      { "internalType": "uint256", "name": "_index",  "type": "uint256" }
    ],
    "name": "getDrugHistoryItem",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugId",     "type": "string"  },
        { "internalType": "string",  "name": "fromId",     "type": "string"  },
        { "internalType": "string",  "name": "toId",       "type": "string"  },
        { "internalType": "uint8",   "name": "fromRole",   "type": "uint8"   },
        { "internalType": "uint8",   "name": "toRole",     "type": "uint8"   },
        { "internalType": "uint256", "name": "quantity",   "type": "uint256" },
        { "internalType": "uint256", "name": "timestamp",  "type": "uint256" },
        { "internalType": "address", "name": "fromWallet", "type": "address" },
        { "internalType": "address", "name": "toWallet",   "type": "address" }
      ],
      "internalType": "struct DrugSupplyChain.DrugTransaction", "name": "", "type": "tuple"
    }],
    "stateMutability": "view", "type": "function"
  },

  // ── Admin stats ──────────────────────────────────────────────────────────
  {
    "inputs": [], "name": "getTotalEntities",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "getTotalDrugs",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "getRecalledDrugs",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugName",          "type": "string"  },
        { "internalType": "string",  "name": "drugId",            "type": "string"  },
        { "internalType": "string",  "name": "manufacturerId",    "type": "string"  },
        { "internalType": "address", "name": "manufacturerWallet","type": "address" },
        { "internalType": "uint256", "name": "manufacturedQty",   "type": "uint256" },
        { "internalType": "uint256", "name": "remainingQty",      "type": "uint256" },
        { "internalType": "uint256", "name": "manufacturingDate", "type": "uint256" },
        { "internalType": "uint256", "name": "expiryDate",        "type": "uint256" },
        { "internalType": "bool",    "name": "isRecalled",        "type": "bool"    },
        { "internalType": "string",  "name": "recallReason",      "type": "string"  },
        { "internalType": "bool",    "name": "exists",            "type": "bool"    },
        { "internalType": "uint256", "name": "createdAt",         "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.DrugBatch[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "getExpiredDrugs",
    "outputs": [{
      "components": [
        { "internalType": "string",  "name": "drugName",          "type": "string"  },
        { "internalType": "string",  "name": "drugId",            "type": "string"  },
        { "internalType": "string",  "name": "manufacturerId",    "type": "string"  },
        { "internalType": "address", "name": "manufacturerWallet","type": "address" },
        { "internalType": "uint256", "name": "manufacturedQty",   "type": "uint256" },
        { "internalType": "uint256", "name": "remainingQty",      "type": "uint256" },
        { "internalType": "uint256", "name": "manufacturingDate", "type": "uint256" },
        { "internalType": "uint256", "name": "expiryDate",        "type": "uint256" },
        { "internalType": "bool",    "name": "isRecalled",        "type": "bool"    },
        { "internalType": "string",  "name": "recallReason",      "type": "string"  },
        { "internalType": "bool",    "name": "exists",            "type": "bool"    },
        { "internalType": "uint256", "name": "createdAt",         "type": "uint256" }
      ],
      "internalType": "struct DrugSupplyChain.DrugBatch[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  }
]
