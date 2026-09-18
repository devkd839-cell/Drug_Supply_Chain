/**
 * contract.js
 * Central place for all blockchain interactions.
 * The rest of the app imports these helpers — never raw ethers.js.
 */
import { ethers } from 'ethers'
import { ABI } from './abi'

// ── Role constants (mirrors Solidity enum) ────────────────────────────────
export const ROLES = {
  None:         0,
  Manufacturer: 1,
  Wholesaler:   2,
  Retailer:     3,
  Customer:     4,
}

export const ROLE_NAMES = {
  0: 'None',
  1: 'Manufacturer',
  2: 'Wholesaler',
  3: 'Retailer',
  4: 'Customer',
}

export const DRUG_STATUS = {
  0: 'Active',
  1: 'Expired',
  2: 'Recalled',
}

// ── Contract address (injected by Vite env or deployments.json) ───────────
export function getContractAddress() {
  // Prefer env variable (set after deployment)
  if (import.meta.env.VITE_CONTRACT_ADDRESS) {
    return import.meta.env.VITE_CONTRACT_ADDRESS
  }
  // Fall back to deployments.json written by deploy.js
  try {
    // Dynamic import at runtime — deployments.json is created after deploy
    return window.__DRUG_CHAIN_ADDRESS__ || null
  } catch {
    return null
  }
}

// ── Provider / Signer helpers ─────────────────────────────────────────────

/** Returns a read-only provider connected to MetaMask's injected provider. */
export function getProvider() {
  if (!window.ethereum) throw new Error('MetaMask is not installed')
  return new ethers.BrowserProvider(window.ethereum)
}

/** Returns a signer (requires MetaMask connection). */
export async function getSigner() {
  const provider = getProvider()
  return provider.getSigner()
}

/** Returns the currently connected account address, or null. */
export async function getCurrentAccount() {
  if (!window.ethereum) return null
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  return accounts[0] || null
}

/** Returns a contract instance (read-only = no signer needed for view calls). */
export async function getReadContract() {
  const address = getContractAddress()
  if (!address) throw new Error('Contract address not configured. Deploy the contract first.')
  const provider = getProvider()
  return new ethers.Contract(address, ABI, provider)
}

/** Returns a contract instance with a signer attached (for transactions). */
export async function getWriteContract() {
  const address = getContractAddress()
  if (!address) throw new Error('Contract address not configured. Deploy the contract first.')
  const signer = await getSigner()
  return new ethers.Contract(address, ABI, signer)
}

// ── MetaMask connection ───────────────────────────────────────────────────

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install it from https://metamask.io')
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  return accounts[0]
}

export async function getNetwork() {
  const provider = getProvider()
  return provider.getNetwork()
}

// ── Entity functions ──────────────────────────────────────────────────────

export async function registerEntity(name, id, role) {
  const contract = await getWriteContract()
  const tx = await contract.registerEntity(name, id, role)
  return tx.wait()
}

export async function getEntityByWallet(wallet) {
  const contract = await getReadContract()
  return contract.getEntityByWallet(wallet)
}

export async function getEntityById(id) {
  const contract = await getReadContract()
  return contract.getEntityById(id)
}

export async function isEntityRegistered(wallet) {
  const contract = await getReadContract()
  return contract.isEntityRegistered(wallet)
}

export async function getAllEntities() {
  const contract = await getReadContract()
  return contract.getAllEntities()
}

export async function getEntitiesByRole(role) {
  const contract = await getReadContract()
  return contract.getEntitiesByRole(role)
}

export async function suspendEntity(id) {
  const contract = await getWriteContract()
  const tx = await contract.suspendEntity(id)
  return tx.wait()
}

export async function activateEntity(id) {
  const contract = await getWriteContract()
  const tx = await contract.activateEntity(id)
  return tx.wait()
}

// ── Drug functions ────────────────────────────────────────────────────────

export async function manufactureDrug(drugName, drugId, quantity, manufacturingDate, expiryDate) {
  const contract = await getWriteContract()
  const tx = await contract.manufactureDrug(
    drugName,
    drugId,
    BigInt(quantity),
    BigInt(Math.floor(manufacturingDate / 1000)),  // ms → seconds
    BigInt(Math.floor(expiryDate / 1000))
  )
  return tx.wait()
}

export async function supplyToWholesaler(drugId, wholesalerId, quantity) {
  const contract = await getWriteContract()
  const tx = await contract.supplyToWholesaler(drugId, wholesalerId, BigInt(quantity))
  return tx.wait()
}

export async function supplyToRetailer(drugId, retailerId, quantity) {
  const contract = await getWriteContract()
  const tx = await contract.supplyToRetailer(drugId, retailerId, BigInt(quantity))
  return tx.wait()
}

export async function supplyToCustomer(drugId, customerId, quantity) {
  const contract = await getWriteContract()
  const tx = await contract.supplyToCustomer(drugId, customerId, BigInt(quantity))
  return tx.wait()
}

export async function recallDrug(drugId, reason) {
  const contract = await getWriteContract()
  const tx = await contract.recallDrug(drugId, reason)
  return tx.wait()
}

export async function getDrug(drugId) {
  const contract = await getReadContract()
  return contract.getDrug(drugId)
}

export async function getAllDrugs() {
  const contract = await getReadContract()
  return contract.getAllDrugs()
}

export async function verifyDrug(drugId) {
  const contract = await getReadContract()
  return contract.verifyDrug(drugId)
}

export async function getDrugStatus(drugId) {
  const contract = await getReadContract()
  return contract.getDrugStatus(drugId)
}

// ── Inventory functions ───────────────────────────────────────────────────

export async function getManufacturerInventory(wallet) {
  const contract = await getReadContract()
  return contract.getManufacturerInventory(wallet)
}

export async function getWholesalerInventory(wallet) {
  const contract = await getReadContract()
  return contract.getWholesalerInventory(wallet)
}

export async function getRetailerInventory(wallet) {
  const contract = await getReadContract()
  return contract.getRetailerInventory(wallet)
}

export async function getCustomerInventory(customerId) {
  const contract = await getReadContract()
  return contract.getCustomerInventory(customerId)
}

// ── Drug history functions ────────────────────────────────────────────────

export async function getDrugHistory(drugId) {
  const contract = await getReadContract()
  return contract.getDrugHistory(drugId)
}

export async function getDrugHistoryCount(drugId) {
  const contract = await getReadContract()
  return contract.getDrugHistoryCount(drugId)
}

// ── Admin stats ───────────────────────────────────────────────────────────

export async function getTotalEntities() {
  const contract = await getReadContract()
  return contract.getTotalEntities()
}

export async function getTotalDrugs() {
  const contract = await getReadContract()
  return contract.getTotalDrugs()
}

export async function getRecalledDrugs() {
  const contract = await getReadContract()
  return contract.getRecalledDrugs()
}

export async function getExpiredDrugs() {
  const contract = await getReadContract()
  return contract.getExpiredDrugs()
}

export async function getContractOwner() {
  const contract = await getReadContract()
  return contract.owner()
}

// ── Error parser ──────────────────────────────────────────────────────────

/**
 * Converts raw ethers/MetaMask errors into human-readable messages.
 */
export function parseContractError(err) {
  if (!err) return 'Unknown error'

  const msg = err?.reason || err?.message || String(err)

  // User rejected
  if (msg.includes('user rejected') || msg.includes('ACTION_REJECTED') || err?.code === 4001) {
    return 'Transaction rejected by user.'
  }

  // Solidity revert strings
  const revertMap = {
    'Caller is not registered':           'You must register before performing this action.',
    'Unauthorized role':                  'Your role is not authorized for this action.',
    'Caller is not the contract owner':   'Only the contract owner can perform this action.',
    'Wallet already registered':          'This wallet address is already registered.',
    'Entity ID already taken':            'This entity ID is already in use.',
    'Role.None is not allowed':           'Please select a valid role.',
    'Drug ID already exists':             'A drug with this ID already exists.',
    'Drug batch does not exist':          'Drug not found on the blockchain.',
    'Insufficient manufacturer stock':    'Not enough stock at the manufacturer.',
    'Insufficient wholesaler stock':      'Not enough stock in wholesaler inventory.',
    'Insufficient retailer stock':        'Not enough stock in retailer inventory.',
    'Drug does not belong to this manufacturer': 'You did not manufacture this drug.',
    'Target ID is not a registered Wholesaler':  'The specified ID is not a registered wholesaler.',
    'Target ID is not a registered Retailer':    'The specified ID is not a registered retailer.',
    'Target ID is not a registered Customer':    'The specified ID is not a registered customer.',
    'Wholesaler does not hold this drug':  'Wholesaler has no inventory for this drug.',
    'Retailer does not hold this drug':    'Retailer has no inventory for this drug.',
    'Drug is expired':                     'This drug has expired and cannot be transferred.',
    'Drug is recalled':                    'This drug has been recalled and cannot be transferred.',
    'Entity is suspended':                 'Your account has been suspended.',
    'Wholesaler is suspended':             'The target wholesaler account is suspended.',
    'Retailer is suspended':               'The target retailer account is suspended.',
    'Customer is suspended':               'The target customer account is suspended.',
    'Not authorized to recall this drug':  'Only the manufacturer or admin can recall this drug.',
    'Drug is already recalled':            'This drug has already been recalled.',
    'Name cannot be empty':                'Name cannot be empty.',
    'ID cannot be empty':                  'ID cannot be empty.',
    'Quantity must be greater than zero':  'Quantity must be greater than zero.',
    'Expiry date is already in the past':  'The expiry date cannot be in the past.',
    'Expiry must be after manufacturing date': 'Expiry date must be after manufacturing date.',
    'Entity not found':                    'Entity not found.',
    'Index out of bounds':                 'Item not found.',
  }

  for (const [key, friendly] of Object.entries(revertMap)) {
    if (msg.includes(key)) return friendly
  }

  // MetaMask network errors
  if (msg.includes('network') || msg.includes('chain')) {
    return 'Wrong network. Please switch to the correct blockchain network in MetaMask.'
  }
  if (msg.includes('nonce')) {
    return 'Transaction nonce error. Please reset your MetaMask account.'
  }

  // Generic fallback
  return msg.length > 120 ? msg.substring(0, 120) + '…' : msg
}

// ── Utility formatters ────────────────────────────────────────────────────

/** Convert BigInt Unix timestamp (seconds) to a JS Date. */
export function tsToDate(ts) {
  return new Date(Number(ts) * 1000)
}

/** Format a Unix timestamp (seconds) to a human-readable string. */
export function formatTimestamp(ts) {
  if (!ts || ts === 0n) return '—'
  return tsToDate(ts).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

/** Format BigInt quantity. */
export function formatQty(qty) {
  return Number(qty).toLocaleString()
}

/** Shorten an Ethereum address for display. */
export function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
