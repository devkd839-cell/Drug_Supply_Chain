import { useState, useCallback, useEffect } from 'react'
import { User, Package, ShieldCheck, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { useContractData } from '../hooks/useContractData'
import { getCustomerInventory, getDrugHistory } from '../blockchain/contract'
import { StatCard } from '../components/StatCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StatusBadge } from '../components/RoleBadge'
import { formatDate, formatQty } from '../utils/helpers'
import { DashboardLayout } from '../layouts/DashboardLayout'

function DrugCard({ drug }) {
  const now = Math.floor(Date.now() / 1000)
  const status = Number(drug.expiryDate) > 0 && Number(drug.expiryDate) < now ? 'Expired' : 'Active'

  return (
    <div className={`card border hover:border-dark-600 transition-colors
      ${status === 'Expired' ? 'border-red-500/30' : 'border-dark-700/60'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-white">{drug.drugName}</p>
          <p className="text-xs font-mono text-dark-400">{drug.drugId}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
        <div>
          <span className="text-dark-500">Quantity</span>
          <p className="text-white font-semibold mt-0.5">{formatQty(drug.quantity)} lots</p>
        </div>
        <div>
          <span className="text-dark-500">From Retailer</span>
          <p className="text-dark-200 mt-0.5">{drug.fromRetailerId}</p>
        </div>
        <div>
          <span className="text-dark-500">Received</span>
          <p className="text-dark-200 mt-0.5">{formatDate(drug.receivedAt)}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link to={`/verify?id=${drug.drugId}`}
          className="btn-secondary text-xs flex-1 justify-center py-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Verify
        </Link>
        <Link to={`/track?id=${drug.drugId}`}
          className="btn-ghost text-xs flex-1 justify-center py-1.5 border border-dark-700">
          Track Chain
        </Link>
      </div>
    </div>
  )
}

export function CustomerDashboard() {
  const { entity } = useWeb3()
  const { pathname } = useLocation()
  const [activeTab,   setActiveTab]   = useState('drugs')
  const [history,     setHistory]     = useState([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    setActiveTab(pathname.split('/')[2] === 'history' ? 'history' : 'drugs')
  }, [pathname])

  const fetchDrugs = useCallback(
    () => entity?.id ? getCustomerInventory(entity.id) : Promise.resolve([]),
    [entity?.id]
  )

  const { data: rawDrugs = [], loading: drugsLoading } = useContractData(fetchDrugs, [entity?.id])

  const drugs = rawDrugs.map(d => ({
    drugId:         d.drugId,
    drugName:       d.drugName,
    quantity:       Number(d.quantity),
    fromRetailerId: d.fromRetailerId,
    receivedAt:     d.receivedAt,
    expiryDate:     0,  // CustomerDrug struct doesn't carry expiry — show as unknown
  }))

  // Fetch supply history for all drugs this customer received
  const fetchHistory = useCallback(async () => {
    if (!entity?.id || rawDrugs.length === 0) return
    setHistLoading(true)
    try {
      const all = []
      const seen = new Set()
      for (const d of rawDrugs) {
        if (seen.has(d.drugId)) continue
        seen.add(d.drugId)
        try {
          const hist = await getDrugHistory(d.drugId)
          all.push(...hist)
        } catch { /* */ }
      }
      all.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      setHistory(all)
    } catch { /* */ } finally {
      setHistLoading(false)
    }
  }, [entity?.id, rawDrugs.length])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const totalQty = drugs.reduce((s, d) => s + d.quantity, 0)

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="h-6 w-6 text-amber-400" /> My Dashboard
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">{entity?.name} · {entity?.id}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        <StatCard label="Drugs Received"     value={drugs.length}         icon={Package} color="amber"  loading={drugsLoading} />
        <StatCard label="Total Quantity"     value={formatQty(totalQty)}  icon={Package} color="blue"   loading={drugsLoading} />
        <StatCard label="Supply Chain Steps" value={history.length}       icon={Clock}   color="purple" loading={histLoading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-dark-800/50 border border-dark-700/40 rounded-xl p-1 w-fit">
        {[
          { key: 'drugs',   label: 'My Drugs'        },
          { key: 'history', label: 'Supply History'  },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === t.key ? 'bg-brand-600/30 text-brand-300 border border-brand-500/30'
                                    : 'text-dark-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'drugs' && (
        drugsLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : drugs.length === 0 ? (
          <EmptyState icon={Package} title="No drugs received yet"
            message="When a retailer supplies you a drug, it will appear here." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {drugs.map((drug, i) => (
              <DrugCard key={`${drug.drugId}-${i}`} drug={drug} />
            ))}
          </div>
        )
      )}

      {activeTab === 'history' && (
        histLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : history.length === 0 ? (
          <EmptyState title="No history yet" message="Supply chain history will appear here once drugs are transferred." />
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Drug ID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Quantity</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t, i) => (
                    <tr key={i}>
                      <td className="font-mono text-brand-400">{t.drugId}</td>
                      <td className="text-dark-200">{t.fromId}</td>
                      <td className="text-dark-200">{t.toId}</td>
                      <td className="font-semibold text-white">{formatQty(t.quantity)}</td>
                      <td className="text-dark-400">
                        {new Date(Number(t.timestamp) * 1000).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </DashboardLayout>
  )
}
