import { useState } from 'react'
import { SearchBar, FilterDropdown } from './SearchBar'
import { EmptyState, ErrorMessage } from './EmptyState'
import { StatusBadge } from './RoleBadge'
import { formatDate, formatQty, getDrugStatus, normalizeSlot, normalizeDrug } from '../utils/helpers'
import { LoadingSpinner } from './LoadingSpinner'
import { Database } from 'lucide-react'

/** Generic inventory table used by all roles */
export function InventoryTable({ items = [], loading = false, error = null, onRetry, type = 'slot', actions }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const normalized = items.map(i => type === 'drug' ? normalizeDrug(i) : normalizeSlot(i))

  const filtered = normalized.filter(item => {
    const id   = (item.drugId   || '').toLowerCase()
    const name = (item.drugName || '').toLowerCase()
    const q    = search.toLowerCase()
    const matchSearch = !q || id.includes(q) || name.includes(q)
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return (
    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  )
  if (error) return <ErrorMessage message={error} onRetry={onRetry} />

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by drug name or ID…"
          className="flex-1"
        />
        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          label="Filter by status"
          options={[
            { value: 'all',      label: 'All Status' },
            { value: 'Active',   label: 'Active'     },
            { value: 'Expired',  label: 'Expired'    },
            { value: 'Recalled', label: 'Recalled'   },
          ]}
          className="sm:w-40"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Database} title="No inventory found" message="No items match your search or filter." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Drug Name</th>
                <th>Drug ID</th>
                {type === 'drug' ? (
                  <>
                    <th>Manufactured</th>
                    <th>Remaining</th>
                    <th>Mfg Date</th>
                    <th>Expiry</th>
                  </>
                ) : (
                  <>
                    <th>Received</th>
                    <th>Available</th>
                    <th>Supplied</th>
                  </>
                )}
                <th>Status</th>
                {actions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={`${item.drugId}-${i}`}>
                  <td className="font-medium text-white">{item.drugName}</td>
                  <td className="font-mono text-brand-400">{item.drugId}</td>
                  {type === 'drug' ? (
                    <>
                      <td>{formatQty(item.manufacturedQty)}</td>
                      <td>{formatQty(item.remainingQty)}</td>
                      <td>{formatDate(item.manufacturingDate)}</td>
                      <td className={item.status === 'Expired' ? 'text-red-400' : ''}>
                        {formatDate(item.expiryDate)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{formatQty(item.receivedQty)}</td>
                      <td className="text-green-400 font-medium">{formatQty(item.availableQty)}</td>
                      <td>{formatQty(item.suppliedQty)}</td>
                    </>
                  )}
                  <td><StatusBadge status={item.status} /></td>
                  {actions && <td>{actions(item)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
