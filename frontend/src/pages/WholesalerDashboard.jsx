import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Truck, Send, Package, ArrowRight } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import { useTransaction } from '../hooks/useTransaction'
import { useContractData } from '../hooks/useContractData'
import {
  supplyToRetailer, getWholesalerInventory, getEntitiesByRole,
  getDrugHistory, ROLES
} from '../blockchain/contract'
import { StatCard } from '../components/StatCard'
import { InventoryTable } from '../components/InventoryTable'
import { TransactionTable } from '../components/TransactionTable'
import { Modal } from '../components/Modal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { normalizeSlot, normalizeTransaction, formatQty } from '../utils/helpers'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function SupplyForm({ inventory, retailers, onSuccess }) {
  const { execute, isPending } = useTransaction()
  const [form,  setForm]  = useState({ drugId: '', retailerId: '', quantity: '' })
  const [error, setError] = useState(null)
  const sel = inventory.find(s => s.drugId === form.drugId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const qty = parseInt(form.quantity)
    if (!form.drugId)       { setError('Select a drug.'); return }
    if (!form.retailerId)   { setError('Select a retailer.'); return }
    if (!qty || qty <= 0)   { setError('Enter a valid quantity.'); return }
    if (sel && qty > sel.availableQty) { setError(`Max: ${formatQty(sel.availableQty)}`); return }
    try {
      await execute(
        () => supplyToRetailer(form.drugId, form.retailerId, qty),
        `Supplied ${qty} lots of ${form.drugId} → ${form.retailerId}`
      )
      setForm({ drugId: '', retailerId: '', quantity: '' })
      onSuccess()
    } catch { /* */ }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div>
        <label className="label">Drug</label>
        <select className="select" value={form.drugId} disabled={isPending}
          onChange={e => setForm(f => ({ ...f, drugId: e.target.value, quantity: '' }))}>
          <option value="">— Select a drug —</option>
          {inventory.filter(s => s.availableQty > 0).map(s => (
            <option key={s.drugId} value={s.drugId}>
              {s.drugName} ({s.drugId}) — {formatQty(s.availableQty)} available
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Retailer</label>
        <select className="select" value={form.retailerId} disabled={isPending}
          onChange={e => setForm(f => ({ ...f, retailerId: e.target.value }))}>
          <option value="">— Select a retailer —</option>
          {retailers.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Quantity {sel && <span className="text-dark-500 font-normal">(max {formatQty(sel.availableQty)})</span>}</label>
        <input className="input" type="number" min={1} max={sel?.availableQty}
          placeholder="Enter quantity" value={form.quantity} disabled={isPending}
          onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
      </div>
      <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
        {isPending ? <><LoadingSpinner size="sm" /> Supplying…</> : <><Send className="h-4 w-4" /> Supply to Retailer</>}
      </button>
    </form>
  )
}

export function WholesalerDashboard() {
  const { account, entity } = useWeb3()
  const { pathname } = useLocation()
  const [activeTab,   setActiveTab]   = useState('overview')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [history,     setHistory]     = useState([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    const section = pathname.split('/')[2]
    if (section === 'inventory' || section === 'history') {
      setActiveTab(section)
      setModalOpen(false)
    } else if (section === 'supply') {
      setActiveTab('overview')
      setModalOpen(true)
    } else {
      setActiveTab('overview')
      setModalOpen(false)
    }
  }, [pathname])

  const fetchInventory = useCallback(() => getWholesalerInventory(account), [account])
  const fetchRetailers = useCallback(() => getEntitiesByRole(ROLES.Retailer), [])

  const { data: rawInv = [], loading: invLoading, refetch: refetchInv } = useContractData(fetchInventory, [account])
  const { data: rawRT  = [] } = useContractData(fetchRetailers, [])

  const inventory = rawInv.map(normalizeSlot)
  const retailers = rawRT.map(r => ({ name: r.name, id: r.id }))

  const fetchHistory = useCallback(async () => {
    if (!account) return
    setHistLoading(true)
    try {
      const inv = await getWholesalerInventory(account)
      const all = []
      for (const s of inv) {
        try {
          const hist = await getDrugHistory(s.drugId)
          // Only show transfers where this wholesaler was the sender
          all.push(...hist.filter(t =>
            Number(t.fromRole) === ROLES.Wholesaler &&
            t.fromWallet.toLowerCase() === account.toLowerCase()
          ))
        } catch { /* */ }
      }
      all.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      setHistory(all.map(normalizeTransaction))
    } catch { /* */ } finally {
      setHistLoading(false)
    }
  }, [account])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const totalReceived  = inventory.reduce((s, d) => s + d.receivedQty,  0)
  const totalAvailable = inventory.reduce((s, d) => s + d.availableQty, 0)
  const totalSupplied  = inventory.reduce((s, d) => s + d.suppliedQty,  0)

  const chartData = inventory.slice(0, 6).map(s => ({
    name:      s.drugId,
    received:  s.receivedQty,
    available: s.availableQty,
    supplied:  s.suppliedQty,
  }))

  const onSuccess = () => { refetchInv(); fetchHistory(); setModalOpen(false) }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-purple-400" /> Wholesaler Dashboard
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">{entity?.name} · {entity?.id}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
          <Send className="h-4 w-4" /> Supply to Retailer
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Drugs in Stock" value={inventory.length}          icon={Package}    color="purple" loading={invLoading} />
        <StatCard label="Total Received" value={formatQty(totalReceived)}  icon={ArrowRight} color="blue"   loading={invLoading} />
        <StatCard label="Available"      value={formatQty(totalAvailable)} icon={Package}    color="green"  loading={invLoading} />
        <StatCard label="Total Supplied" value={formatQty(totalSupplied)}  icon={Send}       color="cyan"   loading={invLoading} />
      </div>

      <div className="flex gap-1 mb-5 bg-dark-800/50 border border-dark-700/40 rounded-xl p-1 w-fit">
        {['overview', 'inventory', 'history'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${activeTab === t ? 'bg-brand-600/30 text-brand-300 border border-brand-500/30'
                                : 'text-dark-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-dark-300 mb-4">Inventory Overview</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#f1f5f9' }} />
                  <Bar dataKey="received"  name="Received"  fill="#8b5cf6" radius={[4,4,0,0]} />
                  <Bar dataKey="available" name="Available" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="supplied"  name="Supplied"  fill="#06b6d4" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="card">
            <h3 className="text-sm font-semibold text-dark-300 mb-4">Recent Transactions</h3>
            <TransactionTable items={history.slice(0, 5)} loading={histLoading} />
          </div>
        </div>
      )}
      {activeTab === 'inventory' && (
        <InventoryTable items={rawInv} loading={invLoading} type="slot" onRetry={refetchInv} />
      )}
      {activeTab === 'history' && (
        <TransactionTable items={history} loading={histLoading} onRetry={fetchHistory} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Supply to Retailer" size="md">
        <SupplyForm inventory={inventory} retailers={retailers} onSuccess={onSuccess} />
      </Modal>
    </DashboardLayout>
  )
}
