import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  connectWallet,
  getCurrentAccount,
  getEntityByWallet,
  getNetwork,
  getContractAddress,
  parseContractError,
  ROLE_NAMES,
} from '../blockchain/contract'

// ─────────────────────────────────────────────────────────────────────────────
const Web3Context = createContext(null)

export function Web3Provider({ children }) {
  const [account,         setAccount]         = useState(null)
  const [entity,          setEntity]          = useState(null)
  const [network,         setNetwork]         = useState(null)
  const [isConnecting,    setIsConnecting]    = useState(false)
  const [isLoading,       setIsLoading]       = useState(true)   // initial app load
  const [isEntityLoading, setIsEntityLoading] = useState(false)  // entity refresh in progress
  const [error,           setError]           = useState(null)
  const [contractReady,   setContractReady]   = useState(false)
  const [toasts,          setToasts]          = useState([])

  // ── Toast helpers ──────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Internal: load entity for a given address ──────────────────────────
  const loadEntity = useCallback(async (addr) => {
    if (!addr) { setEntity(null); return }
    try {
      const e = await getEntityByWallet(addr)
      setEntity(e.isRegistered ? e : null)
    } catch {
      setEntity(null)
    }
  }, [])

  // ── Auto-connect on mount ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        const addr = getContractAddress()
        setContractReady(!!addr)
        const acc = await getCurrentAccount()
        if (acc) {
          setAccount(acc)
          const net = await getNetwork()
          setNetwork(net)
          await loadEntity(acc)
        }
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [loadEntity])

  // ── MetaMask account / chain changes ──────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return

    const onAccountsChanged = async (accounts) => {
      const newAcc = accounts[0] || null
      setAccount(newAcc)
      setEntity(null)
      if (newAcc) {
        const net = await getNetwork()
        setNetwork(net)
        await loadEntity(newAcc)
        addToast(`Switched to ${newAcc.slice(0, 6)}…${newAcc.slice(-4)}`, 'info')
      } else {
        setNetwork(null)
        addToast('Wallet disconnected', 'warning')
      }
    }

    const onChainChanged = () => {
      addToast('Network changed — reloading…', 'info')
      window.location.reload()
    }

    window.ethereum.on('accountsChanged', onAccountsChanged)
    window.ethereum.on('chainChanged', onChainChanged)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener('chainChanged', onChainChanged)
    }
  }, [loadEntity, addToast])

  // ── Connect wallet ────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const acc = await connectWallet()
      setAccount(acc)
      const net = await getNetwork()
      setNetwork(net)
      await loadEntity(acc)
      addToast('Wallet connected successfully!', 'success')
      return acc
    } catch (err) {
      const msg = parseContractError(err)
      setError(msg)
      addToast(msg, 'error')
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [loadEntity, addToast])

  // MetaMask keeps the site permission, but clearing this app's session lets a
  // user explicitly leave an entity and choose another MetaMask account.
  const disconnect = useCallback(() => {
    setAccount(null)
    setEntity(null)
    setNetwork(null)
    setError(null)
  }, [])

  // MetaMask does not expose a direct "set active account" API. Revoking this
  // site's account permission and asking again opens its account picker, which
  // lets a user connect a different on-chain entity.
  const chooseAccount = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install it from https://metamask.io')
    }
    setIsConnecting(true)
    setError(null)
    setAccount(null)
    setEntity(null)
    setNetwork(null)
    try {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
      } catch {
        // This method is optional; account selection still works in wallets
        // that present their account picker for eth_requestAccounts.
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const acc = accounts[0]
      if (!acc) throw new Error('No MetaMask account was selected.')
      setAccount(acc)
      const net = await getNetwork()
      setNetwork(net)
      await loadEntity(acc)
      addToast('Wallet account changed successfully!', 'success')
      return acc
    } catch (err) {
      const msg = parseContractError(err)
      setError(msg)
      addToast(msg, 'error')
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [loadEntity, addToast])

  /**
   * refreshEntity – re-fetches the on-chain entity for the current account.
   * Sets isEntityLoading = true while the fetch is in-flight so that
   * RequireRole shows a loader instead of redirecting on stale role = 0.
   */
  const refreshEntity = useCallback(async () => {
    if (!account) return
    setIsEntityLoading(true)
    try {
      await loadEntity(account)
    } finally {
      setIsEntityLoading(false)
    }
  }, [account, loadEntity])

  // ── Computed helpers ──────────────────────────────────────────────────
  const isConnected  = !!account
  const isRegistered = !!entity?.isRegistered
  const role         = entity ? Number(entity.role) : 0
  const roleName     = ROLE_NAMES[role] || 'None'
  const isAdmin      = account
    ? account.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS || '').toLowerCase()
    : false

  const value = {
    account,
    entity,
    network,
    isConnected,
    isRegistered,
    isConnecting,
    isLoading,
    isEntityLoading,
    error,
    contractReady,
    role,
    roleName,
    isAdmin,
    toasts,
    connect,
    disconnect,
    chooseAccount,
    refreshEntity,
    addToast,
    removeToast,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export function useWeb3() {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used inside <Web3Provider>')
  return ctx
}

export default Web3Context
