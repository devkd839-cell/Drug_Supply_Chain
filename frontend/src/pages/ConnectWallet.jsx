import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wallet, Shield, AlertCircle, ExternalLink, Pill, RefreshCw } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import { ROLES } from '../blockchain/contract'
import { LoadingSpinner } from '../components/LoadingSpinner'

const ROLE_REDIRECTS = {
  [ROLES.Manufacturer]: '/manufacturer',
  [ROLES.Wholesaler]:   '/wholesaler',
  [ROLES.Retailer]:     '/retailer',
  [ROLES.Customer]:     '/customer',
}

export function ConnectWallet() {
  const {
    connect, chooseAccount,
    isConnected, isRegistered, isConnecting,
    isLoading, isEntityLoading,
    role, error,
  } = useWeb3()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Where to send the user after a successful connect
  const from = location.state?.from?.pathname || null

  // Auto-redirect once connected AND entity state is settled
  useEffect(() => {
    if (!isConnected)          return  // not connected yet
    if (isLoading)             return  // initial app boot still running
    if (isEntityLoading)       return  // entity fetch in-flight — wait for it

    if (isRegistered) {
      // Go back to where they came from, or their role dashboard
      navigate(from || ROLE_REDIRECTS[role] || '/register', { replace: true })
    } else {
      navigate('/register', { replace: true })
    }
  }, [isConnected, isRegistered, isLoading, isEntityLoading, role, navigate, from])

  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum
  const busy        = isConnecting || isLoading || isEntityLoading

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
        h-80 w-80 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-dark p-8 shadow-2xl shadow-black/50">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-cyan
                flex items-center justify-center shadow-2xl shadow-brand-900/50">
                <Pill className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full
                bg-gradient-to-br from-accent-cyan to-brand-400
                border-2 border-dark-800 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Connect to DrugChain
          </h1>
          <p className="text-dark-400 text-sm text-center mb-8">
            Connect your MetaMask wallet to access the blockchain supply chain platform.
          </p>

          {/* MetaMask not installed */}
          {!hasMetaMask && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300 font-medium text-sm">MetaMask Not Detected</p>
                  <p className="text-amber-400/70 text-xs mt-1">
                    Please install the MetaMask browser extension to continue.
                  </p>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-300
                      hover:text-amber-200 mt-2 transition-colors"
                  >
                    Install MetaMask <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons / spinner */}
          {(isLoading || isEntityLoading) ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <LoadingSpinner size="lg" />
              <p className="text-dark-400 text-sm">
                {isEntityLoading ? 'Loading account…' : 'Checking wallet…'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={connect}
                disabled={busy || !hasMetaMask}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {isConnecting
                  ? <><LoadingSpinner size="sm" /> Connecting…</>
                  : <><Wallet className="h-5 w-5" /> Connect MetaMask</>
                }
              </button>

              <button
                onClick={async () => { try { await chooseAccount() } catch { /* dismissed */ } }}
                disabled={busy || !hasMetaMask}
                className="btn-secondary w-full justify-center py-2.5 text-sm"
              >
                <RefreshCw className="h-4 w-4" /> Use a different account
              </button>
            </div>
          )}

          {/* Steps */}
          <div className="mt-8 space-y-3">
            {[
              { n: 1, t: 'Connect wallet',    d: 'Approve the connection in MetaMask' },
              { n: 2, t: 'Check registration', d: 'We verify if your wallet is registered on-chain' },
              { n: 3, t: 'Access dashboard',   d: 'Redirected to your role-specific dashboard' },
            ].map(s => (
              <div key={s.n} className="flex gap-3 items-start">
                <div className="h-6 w-6 rounded-full bg-brand-500/20 border border-brand-500/30
                  text-brand-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {s.n}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{s.t}</p>
                  <p className="text-xs text-dark-400">{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div className="mt-6 pt-5 border-t border-dark-700/40 flex gap-2 text-xs text-dark-500">
            <Shield className="h-4 w-4 shrink-0" />
            <span>We never store your private keys. All signing happens locally in MetaMask.</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
