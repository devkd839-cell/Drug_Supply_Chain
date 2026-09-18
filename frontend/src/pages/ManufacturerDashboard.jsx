import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Factory, Package, ArrowRight, AlertTriangle, Plus, Send, RotateCcw } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import { useTransaction } from '../hooks/useTransaction'
import { useContractData } from '../hooks/useContractData'
import {
  manufactureDrug, supplyToWholesaler, recallDrug,
  getManufacturerInventory, getEntitiesByRole, getDrugHistory,
  ROLES
} from '../blockchain/contract'
import { StatCard } from '../components/StatCard'
import { InventoryTable } from '../components/InventoryTable'
import { TransactionTable } from '../components/TransactionTable'
import { Modal } from '../components/Modal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { normalizeDrug, normalizeTransaction, formatQty } from '../utils/helpers'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ── Manufacture form ──────────────────────────────────────────────────────
function ManufactureForm({ onSuccess }) {
  const { execute, isPending } = useTransaction()
  const [form, setForm]  = useState({ drugName: '', drugId: '', quantity: '', mfgDate: '', expiryDate: '' })
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const qty = parseInt(form.quantity)
    if (!form.drugName.trim()) { setError('Drug name is required.'); return }
    if (!form.drugId.trim())   { setError('Drug ID is required.'); return }
    if (isNaN(qty) || qty <= 0){ setError('Quantity must be a positive number.'); return }
    if (!form.mfgDate)         { setError('Manufacturing date is required.'); return }
    if (!form.expiryDate)      { setError('Expiry date is required.'); return }
    const mfgTs    = new Date(form.mfgDate).getTime()
    const expiryTs = new Date(form.expiryDate).getTime()
    if (expiryTs <= mfgTs)   { setError('Expiry date must be after manufacturing date.'); return }
    if (expiryTs <= Date.now()){ setError('Expiry date must be in the future.'); return }

    try {
      await execute(
        () => manufactureDrug(form.drugName.trim(), form.drugId.toUpperCase(), qty, mfgTs, expiryTs),
        `${form.drugId.toUpperCase()} manufactured successfully!`
      )
      setForm({ drugName: '', drugId: '', quantity: '', mfgDate: '', expiryDate: '' })
      onSuccess()
    } catch { /* useTransaction shows toast */ }
  }

  const field = (label, key, props = {}) => (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={form[key]} disabled={isPending}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} {...props} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('Drug Name', 'drugName', { placeholder: 'e.g. Paracetamol' })}
        {field('Drug ID',   'drugId',   { placeholder: 'e.g. D101', className: 'input font-mono',
          onChange: e => setForm(f => ({ ...f, drugId: e.target.value.toUpperCase() })) })}
        {field('Quantity (lots)', 'quantity', { type: 'number', min: 1, placeholder: '1000' })}
        {field('Manufacturing Date', 'mfgDate', { type: 'date' })}
        <div className="sm:col-span-2">
          {field('Expiry Date', 'expiryDate', { type: 'date' })}
        </div>
      </div>
      <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
        {isPending ? <><LoadingSpinner size="sm" /> Manufacturing…</> : <><Plus className="h-4 w-4" /> Manufacture Drug</>}
      </button>
    </form>
  )
}

// ── Supply to wholesaler form ─────────────────────────────────────────────
function SupplyForm({ inventory, wholesalers, onSuccess }) {
  const { execute, isPending } = useTransaction()
  const [form,  setForm]  = useState({ drugId: '', wholesalerId: '', quantity: '' })
  const [error, setError] = useState(null)
  const sel = inventory.find(d => d.drugId === form.drugId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const qty = parseInt(form.quantity)
    if (!form.drugId)        { setError('Select a drug.'); return }
    if (!form.wholesalerId)  { setError('Select a wholesaler.'); return }
    if (!qty || qty <= 0)    { setError('Enter a valid quantity.'); return }
    if (sel && qty > sel.remainingQty) { setError(`Max: ${formatQty(sel.remainingQty)}`); return }
    try {
      await execute(
        () => supplyToWholesaler(form.drugId, form.wholesalerId, qty),
        `Supplied ${qty} lots of ${form.drugId} → ${form.wholesalerId}`
      )
      setForm({ drugId: '', wholesalerId: '', quantity: '' })
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
          {inventory.filter(d => d.remainingQty > 0 && d.status === 'Active').map(d => (
            <option key={d.drugId} value={d.drugId}>
              {d.drugName} ({d.drugId}) — {formatQty(d.remainingQty)} available
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Wholesaler</label>
        <select className="select" value={form.wholesalerId} disabled={isPending}
          onChange={e => setForm(f => ({ ...f, wholesalerId: e.target.value }))}>
          <option value="">— Select a wholesaler —</option>
          {wholesalers.map(w => (
            <option key={w.id} value={w.id}>{w.name} ({w.id})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Quantity {sel && <span className="text-dark-500 font-normal">(max {formatQty(sel.remainingQty)})</span>}</label>
        <input className="input" type="number" min={1} max={sel?.remainingQty}
          placeholder="Enter quantity" value={form.quantity} disabled={isPending}
          onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
      </div>
      <button type="submit" disabled={isPending} className="btn-primary w-full justify-center">
        {isPending ? <><LoadingSpinner size="sm" /> Supplying…</> : <><Send className="h-4 w-4" /> Supply to Wholesaler</>}
      </button>
    </form>
  )
}

// ── Recall form ───────────────────────────────────────────────────────────
function RecallForm({ inventory, onSuccess }) {
  const { execute, isPending } = useTransaction()
  const [form,  setForm]  = useState({ drugId: '', reason: '' })
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.drugId)        { setError('Select a drug.'); return }
    if (!form.reason.trim()) { setError('Reason is required.'); return }
    try {
      await execute(() => recallDrug(form.drugId, form.reason.trim()), `Drug ${form.drugId} recalled.`)
      setForm({ drugId: '', reason: '' })
      onSuccess()
    } catch { /* */ }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <span className="text-amber-300">Recall is permanent. Recalled drugs cannot be transferred.</span>
      </div>
      <div>
        <label className="label">Drug to Recall</label>
        <select className="select" value={form.drugId} disabled={isPending}
          onChange={e => setForm(f => ({ ...f, drugId: e.target.value }))}>
          <option value="">— Select a drug —</option>
          {inventory.filter(d => !d.isRecalled).map(d => (
            <option key={d.drugId} value={d.drugId}>{d.drugName} ({d.drugId})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Reason</label>
        <textarea className="input min-h-[80px] resize-none" placeholder="Why is this drug being recalled?"
          value={form.reason} disabled={isPending}
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
      </div>
      <button type="submit" disabled={isPending}
        className="btn-primary w-full justify-center !from-red-600 !to-red-500 hover:!from-red-500 hover:!to-red-400">
        {isPending ? <><LoadingSpinner size="sm" /> Recalling…</> : <><RotateCcw className="h-4 w-4" /> Recall Drug</>}
      </button>
    </form>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export function ManufacturerDashboard() {
  const { account, entity } = useWeb3()
  const { pathname } = useLocation()
  const [activeTab,  setActiveTab]  = useState('overview')
  const [modalOpen,  setModalOpen]  = useState(null)
  const [history,    setHistory]    = useState([])
  const [histLoading,setHistLoading] = useState(false)

  // Sidebar links target nested routes. Keep the rendered dashboard section
  // in sync with the current route instead of always leaving Overview visible.
  useEffect(() => {
    const section = pathname.split('/')[2]
    if (section === 'inventory' || section === 'history') {
      setActiveTab(section)
      setModalOpen(null)
    } else if (section === 'supply') {
      setActiveTab('overview')
      setModalOpen('supply')
    } else {
      setActiveTab('overview')
      setModalOpen(null)
    }
  }, [pathname])

  // ── Stable fetch functions (useCallback so deps array is stable) ─────
  const fetchInventory   = useCallback(() => getManufacturerInventory(account), [account])
  const fetchWholesalers = useCallback(() => getEntitiesByRole(ROLES.Wholesaler), [])

  const { data: rawInv = [],  loading: invLoading,  refetch: refetchInv } = useContractData(fetchInventory, [account])
  const { data: rawWS  = [] } = useContractData(fetchWholesalers, [])

  const inventory   = rawInv.map(normalizeDrug)
  const wholesalers = rawWS.map(w => ({ name: w.name, id: w.id }))

  // ── Fetch history separately (avoids dep-chain loops) ────────────────
  const fetchHistory = useCallback(async () => {
    if (!account) return
    setHistLoading(true)
    try {
      const inv = await getManufacturerInventory(account)
      const all = []
      for (const d of inv) {
        try {
          const hist = await getDrugHistory(d.drugId)
          all.push(...hist)
        } catch { /* skip individual drug errors */ }
      }
      all.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      setHistory(all.map(normalizeTransaction))
    } catch { /* */ } finally {
      setHistLoading(false)
    }
  }, [account])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  // ── Stats ─────────────────────────────────────────────────────────────
  const totalMfg       = inventory.reduce((s, d) => s + d.manufacturedQty, 0)
  const totalRemaining = inventory.reduce((s, d) => s + d.remainingQty,    0)
  const totalSupplied  = totalMfg - totalRemaining
  const recalled       = inventory.filter(d => d.isRecalled).length

  const chartData = inventory.slice(0, 6).map(d => ({
    name:      d.drugId,
    mfg:       d.manufacturedQty,
    remaining: d.remainingQty,
    supplied:  d.manufacturedQty - d.remainingQty,
  }))

  const onSuccess = () => { refetchInv(); fetchHistory(); setModalOpen(null) }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Factory className="h-6 w-6 text-blue-400" /> Manufacturer Dashboard
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">{entity?.name} · {entity?.id}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setModalOpen('manufacture')} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> Manufacture Drug
          </button>
          <button onClick={() => setModalOpen('supply')} className="btn-secondary text-sm">
            <Send className="h-4 w-4" /> Supply to Wholesaler
          </button>
          <button onClick={() => setModalOpen('recall')}
            className="btn-secondary text-sm !border-red-500/30 !text-red-400 hover:!bg-red-500/10">
            <RotateCcw className="h-4 w-4" /> Recall Drug
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Drugs"    value={inventory.length}         icon={Package}       color="blue"   loading={invLoading} />
        <StatCard label="Total Mfg Qty"  value={formatQty(totalMfg)}      icon={Factory}       color="purple" loading={invLoading} />
        <StatCard label="Total Supplied" value={formatQty(totalSupplied)}  icon={ArrowRight}    color="green"  loading={invLoading} />
        <StatCard label="Recalled"       value={recalled}                  icon={AlertTriangle} color="red"    loading={invLoading} />
      </div>

      {/* Tabs */}
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
              <h3 className="text-sm font-semibold text-dark-300 mb-4">Drug Inventory Overview</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#94a3b8' }} />
                  <Bar dataKey="mfg"       name="Manufactured" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="supplied"  name="Supplied"     fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="remaining" name="Remaining"    fill="#8b5cf6" radius={[4,4,0,0]} />
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
        <InventoryTable items={rawInv} loading={invLoading} type="drug" onRetry={refetchInv} />
      )}

      {activeTab === 'history' && (
        <TransactionTable items={history} loading={histLoading} onRetry={fetchHistory} />
      )}

      {/* Modals */}
      <Modal isOpen={modalOpen === 'manufacture'} onClose={() => setModalOpen(null)} title="Manufacture New Drug" size="md">
        <ManufactureForm onSuccess={onSuccess} />
      </Modal>
      <Modal isOpen={modalOpen === 'supply'} onClose={() => setModalOpen(null)} title="Supply to Wholesaler" size="md">
        <SupplyForm inventory={inventory} wholesalers={wholesalers} onSuccess={onSuccess} />
      </Modal>
      <Modal isOpen={modalOpen === 'recall'} onClose={() => setModalOpen(null)} title="Recall Drug" size="md">
        <RecallForm inventory={inventory} onSuccess={onSuccess} />
      </Modal>
    </DashboardLayout>
  )
}
