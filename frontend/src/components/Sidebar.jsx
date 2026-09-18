import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ArrowRightLeft, Search,
  History, Database, ShieldAlert, Users, Pill, Activity, LogOut,
} from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import { RoleBadge } from './RoleBadge'
import { ROLES, getContractOwner } from '../blockchain/contract'

// ── Per-role navigation items ─────────────────────────────────────────────
function getNavItems(role, isOwner) {
  const common = [
    { to: '/verify', icon: Search,   label: 'Verify Drug' },
    { to: '/track',  icon: Activity, label: 'Track Drug'  },
  ]

  // Contract owner gets admin panel regardless of their registered role
  if (isOwner) {
    return [
      { to: '/admin',          icon: ShieldAlert,     label: 'Admin Dashboard' },
      { to: '/admin',          icon: Users,           label: 'Entities'        },
      { to: '/admin',          icon: Pill,            label: 'All Drugs'       },
      ...common,
    ]
  }

  if (role === ROLES.Manufacturer) return [
    { to: '/manufacturer', icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/manufacturer', icon: Database,        label: 'My Inventory' },
    { to: '/manufacturer', icon: ArrowRightLeft,  label: 'Supply'       },
    { to: '/manufacturer', icon: History,         label: 'Tx History'   },
    ...common,
  ]

  if (role === ROLES.Wholesaler) return [
    { to: '/wholesaler', icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/wholesaler', icon: Database,        label: 'My Inventory' },
    { to: '/wholesaler', icon: ArrowRightLeft,  label: 'Supply'       },
    { to: '/wholesaler', icon: History,         label: 'Tx History'   },
    ...common,
  ]

  if (role === ROLES.Retailer) return [
    { to: '/retailer', icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/retailer', icon: Database,        label: 'My Inventory' },
    { to: '/retailer', icon: ArrowRightLeft,  label: 'Supply'       },
    { to: '/retailer', icon: History,         label: 'Tx History'   },
    ...common,
  ]

  if (role === ROLES.Customer) return [
    { to: '/customer', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customer', icon: Package,         label: 'My Drugs'  },
    { to: '/customer', icon: History,         label: 'Tx History'},
    ...common,
  ]

  return common
}

// ── Small hook: fetch the contract owner once ─────────────────────────────
function useContractOwnerAddress() {
  const [owner, setOwner] = useState('')
  useEffect(() => {
    getContractOwner()
      .then(addr => setOwner((addr || '').toLowerCase()))
      .catch(() => {})
  }, [])
  return owner
}

// ── Sidebar component ─────────────────────────────────────────────────────
export function Sidebar({ isOpen, onClose }) {
  const { account, entity, role, disconnect } = useWeb3()
  const contractOwner = useContractOwnerAddress()
  const navigate      = useNavigate()

  const isOwner = !!(account && contractOwner && account.toLowerCase() === contractOwner)
  const navItems = getNavItems(role, isOwner)

  const handleLogout = () => {
    disconnect()
    onClose()
    navigate('/', { replace: true })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside className={`
        fixed top-16 left-0 bottom-0 z-20 w-60 flex flex-col
        bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/60
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:top-0
      `}>

        {/* Entity info */}
        {entity && (
          <div className="px-4 py-4 border-b border-dark-700/40">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-600 to-accent-cyan
                flex items-center justify-center text-white font-bold text-sm shrink-0">
                {entity.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{entity.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleBadge role={entity.role} />
                  <span className="text-xs text-dark-400">{entity.id}</span>
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded
                bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-semibold">
                <ShieldAlert className="h-3 w-3" /> Contract Owner
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item, i) => (
            <NavLink
              key={`${item.to}-${i}`}
              to={item.to}
              end={item.to !== '/admin'} // admin sub-routes should highlight parent
              onClick={() => { if (window.innerWidth < 1024) onClose() }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: wallet info + Log Out button */}
        <div className="px-3 py-3 border-t border-dark-700/40 space-y-2">
          {/* Wallet address */}
          <div className="px-3">
            <p className="font-mono text-[10px] text-dark-500 truncate">{account}</p>
            <p className="text-[10px] text-dark-600 mt-0.5">DrugChain v1.0</p>
          </div>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
              text-red-400 hover:text-red-300 hover:bg-red-500/10
              border border-transparent hover:border-red-500/20
              transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  )
}
