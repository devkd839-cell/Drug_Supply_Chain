import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Pill, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useWeb3 } from '../context/Web3Context'
import { WalletButton } from './WalletButton'

export function Navbar({ onMenuClick, sidebarOpen }) {
  const { isConnected, isRegistered, roleName } = useWeb3()
  const location = useLocation()

  const isLanding = location.pathname === '/'

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-dark-700/60 bg-dark-900/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 max-w-screen-2xl mx-auto">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          {isConnected && isRegistered && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Logo icon */}
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-cyan
                flex items-center justify-center shadow-lg shadow-brand-900/50
                group-hover:shadow-brand-500/30 transition-shadow">
                <Pill className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full
                bg-gradient-to-br from-accent-cyan to-brand-400
                border-2 border-dark-900 flex items-center justify-center">
                <div className="h-1 w-1 rounded-full bg-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-white text-lg leading-none">Drug</span>
              <span className="font-bold gradient-text text-lg leading-none">Chain</span>
            </div>
          </Link>
        </div>

        {/* Center nav links (desktop only, show on landing) */}
        {isLanding && (
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/verify" className="btn-ghost text-sm">Verify Drug</Link>
            <Link to="/track"  className="btn-ghost text-sm">Track Drug</Link>
          </nav>
        )}

        {/* Right: wallet + network indicator */}
        <div className="flex items-center gap-3">
          {isConnected && isRegistered && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg
              bg-green-500/10 border border-green-500/20">
              <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-green-400 font-medium">{roleName}</span>
            </div>
          )}
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
