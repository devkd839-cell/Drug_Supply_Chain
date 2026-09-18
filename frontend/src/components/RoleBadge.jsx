import { ROLE_COLORS, ROLE_LABELS } from '../utils/helpers'
import { Factory, Truck, Store, User, Shield } from 'lucide-react'

const ROLE_ICONS = {
  1: <Factory className="h-3 w-3" />,
  2: <Truck   className="h-3 w-3" />,
  3: <Store   className="h-3 w-3" />,
  4: <User    className="h-3 w-3" />,
  0: <Shield  className="h-3 w-3" />,
}

export function RoleBadge({ role, showIcon = true, className = '' }) {
  const r = Number(role)
  return (
    <span className={`badge border ${ROLE_COLORS[r] || ROLE_COLORS[0]} ${className}`}>
      {showIcon && ROLE_ICONS[r]}
      {ROLE_LABELS[r] || 'Unknown'}
    </span>
  )
}

export function StatusBadge({ status, className = '' }) {
  const colors = {
    Active:   'text-green-400 bg-green-500/10 border-green-500/30',
    Expired:  'text-red-400   bg-red-500/10   border-red-500/30',
    Recalled: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    Active_entity:   'text-green-400 bg-green-500/10 border-green-500/30',
    Suspended:'text-red-400   bg-red-500/10   border-red-500/30',
  }
  const icons = {
    Active: '●', Expired: '●', Recalled: '⚠', Suspended: '●', Active_entity: '●',
  }
  return (
    <span className={`badge border ${colors[status] || 'text-dark-400 bg-dark-700 border-dark-600'} ${className}`}>
      <span className="text-[8px]">{icons[status] || '●'}</span>
      {status}
    </span>
  )
}
