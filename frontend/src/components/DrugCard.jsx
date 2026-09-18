import { Pill, Calendar, AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react'
import { formatDate, formatQty, getDrugStatus, STATUS_COLORS, isExpiringSoon } from '../utils/helpers'
import { StatusBadge } from './RoleBadge'
import { Link } from 'react-router-dom'

export function DrugCard({ drug, actions, compact = false }) {
  if (!drug) return null
  const status = getDrugStatus(drug)
  const expiring = isExpiringSoon(drug) && status === 'Active'

  return (
    <div className={`card border ${
      status === 'Recalled' ? 'border-amber-500/30' :
      status === 'Expired'  ? 'border-red-500/30'   :
      expiring              ? 'border-amber-500/20'  :
      'border-dark-700/60'
    } hover:border-dark-600 transition-colors`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <Pill className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{drug.drugName}</p>
            <p className="text-xs font-mono text-dark-400">{drug.drugId}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
          <div>
            <span className="text-dark-500">Manufacturer</span>
            <p className="text-dark-200 font-medium">{drug.manufacturerId}</p>
          </div>
          <div>
            <span className="text-dark-500">Manufactured Qty</span>
            <p className="text-dark-200 font-medium">{formatQty(drug.manufacturedQty)}</p>
          </div>
          <div>
            <span className="text-dark-500">Remaining</span>
            <p className="text-dark-200 font-medium">{formatQty(drug.remainingQty)}</p>
          </div>
          <div>
            <span className="text-dark-500">Expiry</span>
            <p className={`font-medium ${expiring ? 'text-amber-400' : status === 'Expired' ? 'text-red-400' : 'text-dark-200'}`}>
              {formatDate(drug.expiryDate)}
            </p>
          </div>
        </div>
      )}

      {expiring && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-2.5 py-1.5 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Expiring within 30 days
        </div>
      )}

      {actions && <div className="flex gap-2 mt-1">{actions}</div>}
    </div>
  )
}
