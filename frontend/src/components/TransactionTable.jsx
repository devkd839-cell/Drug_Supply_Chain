import { useState } from 'react'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { RoleBadge } from './RoleBadge'
import { formatDateTime, formatQty, normalizeTransaction, txLink } from '../utils/helpers'
import { SearchBar } from './SearchBar'
import { EmptyState, ErrorMessage } from './EmptyState'
import { LoadingSpinner } from './LoadingSpinner'
import { History } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'

export function TransactionTable({ items = [], loading = false, error = null, onRetry }) {
  const [search, setSearch] = useState('')
  const { network } = useWeb3()

  const normalized = items.map(normalizeTransaction)
  const filtered   = normalized.filter(t => {
    const q = search.toLowerCase()
    return !q || t.drugId.toLowerCase().includes(q) ||
                 t.fromId.toLowerCase().includes(q) ||
                 t.toId.toLowerCase().includes(q)
  })

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  if (error)   return <ErrorMessage message={error} onRetry={onRetry} />

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Search by drug ID, sender or receiver…" />

      {filtered.length === 0 ? (
        <EmptyState icon={History} title="No transactions" message="No supply-chain transactions found." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Drug ID</th>
                <th>From</th>
                <th></th>
                <th>To</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i}>
                  <td className="text-dark-400 whitespace-nowrap">{formatDateTime(t.timestamp)}</td>
                  <td className="font-mono text-brand-400">{t.drugId}</td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-white">{t.fromId}</span>
                      <RoleBadge role={t.fromRole} />
                    </div>
                  </td>
                  <td><ArrowRight className="h-4 w-4 text-dark-500" /></td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-white">{t.toId}</span>
                      <RoleBadge role={t.toRole} />
                    </div>
                  </td>
                  <td className="font-semibold text-white">{formatQty(t.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
