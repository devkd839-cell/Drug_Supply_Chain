/**
 * helpers.js — shared UI utility functions
 */

export const ROLE_COLORS = {
  1: 'text-blue-400  bg-blue-500/10  border-blue-500/30',
  2: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  3: 'text-green-400  bg-green-500/10  border-green-500/30',
  4: 'text-amber-400  bg-amber-500/10  border-amber-500/30',
  0: 'text-dark-400   bg-dark-700      border-dark-600',
}

export const ROLE_LABELS = {
  1: 'Manufacturer',
  2: 'Wholesaler',
  3: 'Retailer',
  4: 'Customer',
  0: 'None',
}

export const STATUS_COLORS = {
  Active:   'text-green-400  bg-green-500/10  border-green-500/30',
  Expired:  'text-red-400    bg-red-500/10    border-red-500/30',
  Recalled: 'text-amber-400  bg-amber-500/10  border-amber-500/30',
}

/** Unix timestamp (seconds BigInt) → formatted date string */
export function formatDate(ts) {
  if (!ts && ts !== 0n) return '—'
  const ms = Number(ts) * 1000
  if (ms === 0) return '—'
  return new Date(ms).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** Unix timestamp (seconds BigInt) → full datetime */
export function formatDateTime(ts) {
  if (!ts && ts !== 0n) return '—'
  const ms = Number(ts) * 1000
  if (ms === 0) return '—'
  return new Date(ms).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** BigInt / number quantity → comma-formatted string */
export function formatQty(qty) {
  if (qty === null || qty === undefined) return '0'
  return Number(qty).toLocaleString()
}

/** Shorten 0x address */
export function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Determine drug status from a DrugBatch object */
export function getDrugStatus(drug) {
  if (!drug) return 'Unknown'
  if (drug.isRecalled) return 'Recalled'
  const now = Math.floor(Date.now() / 1000)
  if (Number(drug.expiryDate) < now) return 'Expired'
  return 'Active'
}

/** Is the drug expiring within 30 days? */
export function isExpiringSoon(drug) {
  if (!drug) return false
  const thirtyDays = 30 * 24 * 60 * 60
  const now = Math.floor(Date.now() / 1000)
  const expiry = Number(drug.expiryDate)
  return expiry > now && expiry - now < thirtyDays
}

/** Returns explorer base URL for the given network name */
export function getExplorerUrl(networkName) {
  const map = {
    sepolia:  'https://sepolia.etherscan.io',
    mainnet:  'https://etherscan.io',
    localhost: null,
    hardhat:   null,
  }
  return map[networkName?.toLowerCase()] || null
}

/** Build a txn link on Etherscan if available */
export function txLink(txHash, networkName) {
  const base = getExplorerUrl(networkName)
  if (!base || !txHash) return null
  return `${base}/tx/${txHash}`
}

/** Converts a "YYYY-MM-DD" date-input string to Unix seconds */
export function dateStringToTs(dateStr) {
  if (!dateStr) return 0
  return Math.floor(new Date(dateStr).getTime() / 1000) * 1000  // keep as ms for contract.js
}

/** Normalize raw contract entity to plain JS object */
export function normalizeEntity(e) {
  if (!e) return null
  return {
    name:         e.name,
    id:           e.id,
    role:         Number(e.role),
    wallet:       e.wallet,
    isRegistered: e.isRegistered,
    isActive:     e.isActive,
    registeredAt: e.registeredAt,
  }
}

/** Normalize raw DrugBatch */
export function normalizeDrug(d) {
  if (!d) return null
  return {
    drugName:          d.drugName,
    drugId:            d.drugId,
    manufacturerId:    d.manufacturerId,
    manufacturerWallet:d.manufacturerWallet,
    manufacturedQty:   Number(d.manufacturedQty),
    remainingQty:      Number(d.remainingQty),
    manufacturingDate: d.manufacturingDate,
    expiryDate:        d.expiryDate,
    isRecalled:        d.isRecalled,
    recallReason:      d.recallReason,
    exists:            d.exists,
    createdAt:         d.createdAt,
    status:            (() => {
      if (d.isRecalled) return 'Recalled'
      const now = Math.floor(Date.now() / 1000)
      if (Number(d.expiryDate) < now) return 'Expired'
      return 'Active'
    })(),
  }
}

/** Normalize InventorySlot — includes status for table filtering */
export function normalizeSlot(s) {
  if (!s) return null
  const now = Math.floor(Date.now() / 1000)
  // InventorySlots don't carry expiry — default Active unless we know otherwise
  return {
    drugId:       s.drugId,
    drugName:     s.drugName,
    receivedQty:  Number(s.receivedQty),
    availableQty: Number(s.availableQty),
    suppliedQty:  Number(s.suppliedQty),
    exists:       s.exists,
    status:       'Active',   // slots themselves are always Active; expiry is on the DrugBatch
  }
}

/** Normalize DrugTransaction */
export function normalizeTransaction(t) {
  if (!t) return null
  return {
    drugId:     t.drugId,
    fromId:     t.fromId,
    toId:       t.toId,
    fromRole:   Number(t.fromRole),
    toRole:     Number(t.toRole),
    quantity:   Number(t.quantity),
    timestamp:  t.timestamp,
    fromWallet: t.fromWallet,
    toWallet:   t.toWallet,
  }
}

/** Truncate string to max length */
export function truncate(str, max = 30) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}
