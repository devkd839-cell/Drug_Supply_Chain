import { Factory, Truck, Store, User, CheckCircle, ArrowDown } from 'lucide-react'
import { formatDateTime, formatQty, ROLE_LABELS } from '../utils/helpers'
import { ROLES } from '../blockchain/contract'

const STEP_CONFIG = {
  [ROLES.Manufacturer]: {
    icon: Factory,
    color:  'from-blue-600   to-blue-500',
    border: 'border-blue-500/40',
    bg:     'bg-blue-500/10',
    text:   'text-blue-400',
    ring:   'ring-blue-500/30',
  },
  [ROLES.Wholesaler]: {
    icon: Truck,
    color:  'from-purple-600 to-purple-500',
    border: 'border-purple-500/40',
    bg:     'bg-purple-500/10',
    text:   'text-purple-400',
    ring:   'ring-purple-500/30',
  },
  [ROLES.Retailer]: {
    icon: Store,
    color:  'from-green-600  to-green-500',
    border: 'border-green-500/40',
    bg:     'bg-green-500/10',
    text:   'text-green-400',
    ring:   'ring-green-500/30',
  },
  [ROLES.Customer]: {
    icon: User,
    color:  'from-amber-500  to-amber-400',
    border: 'border-amber-500/40',
    bg:     'bg-amber-500/10',
    text:   'text-amber-400',
    ring:   'ring-amber-500/30',
  },
}

/** A single timeline node */
function TimelineNode({ tx, isLast, entityName }) {
  const cfg = STEP_CONFIG[tx.toRole] || STEP_CONFIG[ROLES.Customer]
  const Icon = cfg.icon

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div className={`w-full max-w-sm card border ${cfg.border} ${cfg.bg} relative ring-1 ${cfg.ring}`}>
        {/* Role icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cfg.color} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${cfg.text}`}>
              {ROLE_LABELS[tx.toRole]}
            </p>
            <p className="text-white font-bold">{entityName || tx.toId}</p>
            <p className="text-dark-400 text-xs font-mono">{tx.toId}</p>
          </div>
          <CheckCircle className={`h-5 w-5 ${cfg.text} ml-auto`} />
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-dark-700/40 pt-3">
          <div>
            <span className="text-dark-500">Quantity</span>
            <p className="text-white font-semibold">{formatQty(tx.quantity)} lots</p>
          </div>
          <div>
            <span className="text-dark-500">Date</span>
            <p className="text-white font-medium">{formatDateTime(tx.timestamp)}</p>
          </div>
          <div className="col-span-2">
            <span className="text-dark-500">From</span>
            <p className="text-dark-200 font-medium">{tx.fromId} <span className="text-dark-500">({ROLE_LABELS[tx.fromRole]})</span></p>
          </div>
          <div className="col-span-2">
            <span className="text-dark-500">Wallet</span>
            <p className="font-mono text-dark-400 truncate">{tx.toWallet}</p>
          </div>
        </div>
      </div>

      {/* Arrow down (not on last node) */}
      {!isLast && (
        <div className="flex flex-col items-center my-2 gap-1">
          <div className="w-px h-5 bg-gradient-to-b from-dark-600 to-dark-700" />
          <ArrowDown className="h-5 w-5 text-dark-500" />
          <div className="w-px h-5 bg-gradient-to-b from-dark-700 to-dark-800" />
        </div>
      )}
    </div>
  )
}

/** First node — the manufacturer (source) */
function ManufacturerNode({ tx, entityName }) {
  const cfg = STEP_CONFIG[ROLES.Manufacturer]
  const Icon = cfg.icon

  return (
    <div className="flex flex-col items-center">
      <div className={`w-full max-w-sm card border ${cfg.border} ${cfg.bg} ring-1 ${cfg.ring}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cfg.color} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${cfg.text}`}>
              Manufacturer
            </p>
            <p className="text-white font-bold">{entityName || tx.fromId}</p>
            <p className="text-dark-400 text-xs font-mono">{tx.fromId}</p>
          </div>
          <CheckCircle className={`h-5 w-5 ${cfg.text} ml-auto`} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-dark-700/40 pt-3">
          <div>
            <span className="text-dark-500">Manufactured Qty</span>
            <p className="text-white font-semibold">{formatQty(tx.quantity)} lots</p>
          </div>
          <div>
            <span className="text-dark-500">First Supply</span>
            <p className="text-white font-medium">{formatDateTime(tx.timestamp)}</p>
          </div>
          <div className="col-span-2">
            <span className="text-dark-500">Wallet</span>
            <p className="font-mono text-dark-400 truncate">{tx.fromWallet}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center my-2 gap-1">
        <div className="w-px h-5 bg-gradient-to-b from-dark-600 to-dark-700" />
        <ArrowDown className="h-5 w-5 text-dark-500" />
        <div className="w-px h-5 bg-gradient-to-b from-dark-700 to-dark-800" />
      </div>
    </div>
  )
}

/**
 * Full supply-chain timeline.
 * @param {Array} history — array of DrugTransaction objects
 * @param {Object} entityMap — { id: name } lookup for display names
 */
export function Timeline({ history = [], entityMap = {} }) {
  if (!history.length) return null

  return (
    <div className="flex flex-col items-center w-full py-4">
      {/* First node is always from the manufacturer side */}
      <ManufacturerNode
        tx={history[0]}
        entityName={entityMap[history[0].fromId]}
      />
      {history.map((tx, i) => (
        <TimelineNode
          key={i}
          tx={tx}
          isLast={i === history.length - 1}
          entityName={entityMap[tx.toId]}
        />
      ))}
    </div>
  )
}
