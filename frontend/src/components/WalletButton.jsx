import { Wallet, ChevronDown, LogOut, Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { shortenAddress } from '../utils/helpers'
import { RoleBadge } from './RoleBadge'
import { LoadingSpinner } from './LoadingSpinner'

export function WalletButton() {
  const { account, entity, isConnecting, isConnected, connect, disconnect, chooseAccount, network, addToast } = useWeb3()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const copyAddress = () => {
    navigator.clipboard.writeText(account)
    addToast('Address copied!', 'success', 2000)
    setOpen(false)
  }

  const handleLogout = () => {
    disconnect()
    setOpen(false)
    navigate('/', { replace: true })
  }

  const handleChooseAccount = async () => {
    try {
      await chooseAccount()
      setOpen(false)
    } catch { /* The context displays the wallet error. */ }
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="btn-primary text-sm"
      >
        {isConnecting ? (
          <><LoadingSpinner size="sm" /> Connecting…</>
        ) : (
          <><Wallet className="h-4 w-4" /> Connect Wallet</>
        )}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl
          bg-dark-800 border border-dark-600 hover:border-dark-500
          text-sm font-medium text-dark-200 transition-all"
      >
        {/* green dot */}
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-slow" />
        <span className="hidden sm:inline font-mono text-xs">{shortenAddress(account)}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 glass-dark shadow-xl shadow-black/40 overflow-hidden">
            {/* entity info */}
            <div className="px-4 py-3 border-b border-dark-700/40">
              <p className="text-xs text-dark-400 mb-1">Connected as</p>
              <p className="font-semibold text-white truncate">{entity?.name || 'Not Registered'}</p>
              {entity && (
                <div className="flex items-center gap-2 mt-1">
                  <RoleBadge role={entity.role} />
                  <span className="text-xs text-dark-400">{entity.id}</span>
                </div>
              )}
              <p className="font-mono text-xs text-dark-400 mt-2 truncate">{account}</p>
              {network && (
                <p className="text-xs text-dark-500 mt-0.5">
                  {network.name} (chain {String(network.chainId)})
                </p>
              )}
            </div>
            {/* actions */}
            <div className="p-1">
              <button onClick={copyAddress} className="btn-ghost w-full justify-start text-xs">
                <Copy className="h-3.5 w-3.5" /> Copy Address
              </button>
              <button onClick={handleChooseAccount} className="btn-ghost w-full justify-start text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Choose another account
              </button>
              <button onClick={handleLogout} className="btn-ghost w-full justify-start text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10">
                <LogOut className="h-3.5 w-3.5" /> Log out / switch entity
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
