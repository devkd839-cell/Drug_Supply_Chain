import { useState, useCallback } from 'react'
import { ShieldAlert, Users, Package, AlertTriangle, Activity, Check, Ban } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import { useTransaction } from '../hooks/useTransaction'
import { useContractData } from '../hooks/useContractData'
import {
  getAllEntities, getAllDrugs, getRecalledDrugs, getExpiredDrugs,
  suspendEntity, activateEntity, recallDrug,
  ROLES
} from '../blockchain/contract'
import { StatCard } from '../components/StatCard'
import { RoleBadge, StatusBadge } from '../components/RoleBadge'
import { Modal, ConfirmDialog } from '../components/Modal'
import { SearchBar } from '../components/SearchBar'
import { EmptyState, ErrorMessage } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { normalizeDrug, formatDate, formatQty, shortenAddress } from '../utils/helpers'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export function AdminDashboard() {
  const { account, addToast } = useWeb3()
  const { execute } = useTransaction()

  const [activeTab, setActiveTab] = useState('overview')
  const [entitySearch, setEntitySearch] = useState('')
  const [drugSearch,   setDrugSearch]   = useState('')
  const [confirmModal, setConfirmModal] = useState(null) // { action, id, name }
  const [recallModal,  setRecallModal]  = useState(null)
  const [recallReason, setRecallReason] = useState('')

  // ── Data fetching ──────────────────────────────────────────────────────
  const { data: entities = [],  loading: entLoading,  error: entError,  refetch: refetchEnt }  = useContractData(getAllEntities, [])
  const { data: rawDrugs = [],  loading: drugLoading, error: drugError, refetch: refetchDrugs } = useContractData(getAllDrugs,    [])
  const { data: recalled = [] } = useContractData(getRecalledDrugs, [])
  const { data: expired  = [] } = useContractData(getExpiredDrugs,  [])

  const drugs = rawDrugs.map(normalizeDrug)

  // ── Stats ──────────────────────────────────────────────────────────────
  const countByRole = (role) => entities.filter(e => Number(e.role) === role).length
  const activeEntities   = entities.filter(e => e.isActive).length
  const suspendedEntities = entities.filter(e => !e.isActive).length

  // ── Charts ─────────────────────────────────────────────────────────────
  const rolePieData = [
    { name: 'Manufacturers', value: countByRole(ROLES.Manufacturer), color: '#3b82f6' },
    { name: 'Wholesalers',   value: countByRole(ROLES.Wholesaler),   color: '#8b5cf6' },
    { name: 'Retailers',     value: countByRole(ROLES.Retailer),     color: '#10b981' },
    { name: 'Customers',     value: countByRole(ROLES.Customer),     color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const drugStatusData = [
    { name: 'Active',   value: drugs.filter(d => d.status === 'Active').length,   color: '#10b981' },
    { name: 'Expired',  value: drugs.filter(d => d.status === 'Expired').length,  color: '#ef4444' },
    { name: 'Recalled', value: drugs.filter(d => d.status === 'Recalled').length, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  // ── Actions ────────────────────────────────────────────────────────────
  const handleSuspend = async () => {
    if (!confirmModal) return
    await execute(
      () => suspendEntity(confirmModal.id),
      `Entity ${confirmModal.name} suspended.`
    )
    refetchEnt()
    setConfirmModal(null)
  }

  const handleActivate = async () => {
    if (!confirmModal) return
    await execute(
      () => activateEntity(confirmModal.id),
      `Entity ${confirmModal.name} reactivated.`
    )
    refetchEnt()
    setConfirmModal(null)
  }

  const handleRecall = async () => {
    if (!recallModal || !recallReason.trim()) {
      addToast('Please enter a recall reason.', 'error'); return
    }
    await execute(
      () => recallDrug(recallModal.drugId, recallReason.trim()),
      `Drug ${recallModal.drugId} recalled.`
    )
    refetchDrugs()
    setRecallModal(null)
    setRecallReason('')
  }

  // ── Filtered lists ─────────────────────────────────────────────────────
  const filteredEntities = entities.filter(e => {
    const q = entitySearch.toLowerCase()
    return !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
  })

  const filteredDrugs = drugs.filter(d => {
    const q = drugSearch.toLowerCase()
    return !q || d.drugName.toLowerCase().includes(q) || d.drugId.toLowerCase().includes(q)
  })

  const TABS = ['overview', 'entities', 'drugs']

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-400" /> Admin Dashboard
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">Contract owner controls</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Entities"  value={entities.length}       icon={Users}         color="blue"   loading={entLoading} />
        <StatCard label="Total Drugs"     value={drugs.length}          icon={Package}       color="purple" loading={drugLoading} />
        <StatCard label="Recalled Drugs"  value={recalled.length}       icon={AlertTriangle} color="amber"  loading={drugLoading} />
        <StatCard label="Expired Drugs"   value={expired.length}        icon={Activity}      color="red"    loading={drugLoading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-dark-800/50 border border-dark-700/40 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${activeTab === t ? 'bg-brand-600/30 text-brand-300 border border-brand-500/30' : 'text-dark-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview tab ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Manufacturers" value={countByRole(ROLES.Manufacturer)} color="blue"   loading={entLoading} />
            <StatCard label="Wholesalers"   value={countByRole(ROLES.Wholesaler)}   color="purple" loading={entLoading} />
            <StatCard label="Retailers"     value={countByRole(ROLES.Retailer)}     color="green"  loading={entLoading} />
            <StatCard label="Customers"     value={countByRole(ROLES.Customer)}     color="amber"  loading={entLoading} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Role distribution */}
            <div className="card">
              <h3 className="text-sm font-semibold text-dark-300 mb-4">Entity Distribution</h3>
              {rolePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={rolePieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name, value}) => `${name}: ${value}`} labelLine={false}>
                      {rolePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-dark-400 text-sm text-center py-8">No entities registered yet.</p>}
            </div>

            {/* Drug status */}
            <div className="card">
              <h3 className="text-sm font-semibold text-dark-300 mb-4">Drug Status</h3>
              {drugStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={drugStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      labelStyle={{ color: '#f1f5f9' }} />
                    <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                      {drugStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-dark-400 text-sm text-center py-8">No drugs on chain yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Entities tab ──────────────────────────────────────────────── */}
      {activeTab === 'entities' && (
        <div className="space-y-4">
          <SearchBar value={entitySearch} onChange={setEntitySearch} placeholder="Search by name or ID…" />
          {entLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : entError ? (
            <ErrorMessage message={entError} onRetry={refetchEnt} />
          ) : filteredEntities.length === 0 ? (
            <EmptyState icon={Users} title="No entities found" />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr>
                  <th>Name</th><th>ID</th><th>Role</th><th>Status</th><th>Wallet</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filteredEntities.map(e => (
                    <tr key={e.id}>
                      <td className="font-medium text-white">{e.name}</td>
                      <td className="font-mono text-brand-400">{e.id}</td>
                      <td><RoleBadge role={e.role} /></td>
                      <td><StatusBadge status={e.isActive ? 'Active_entity' : 'Suspended'} /></td>
                      <td className="font-mono text-xs text-dark-400">{shortenAddress(e.wallet)}</td>
                      <td>
                        {e.isActive ? (
                          <button
                            onClick={() => setConfirmModal({ action: 'suspend', id: e.id, name: e.name })}
                            className="btn-ghost text-xs text-red-400 !py-1">
                            <Ban className="h-3.5 w-3.5" /> Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmModal({ action: 'activate', id: e.id, name: e.name })}
                            className="btn-ghost text-xs text-green-400 !py-1">
                            <Check className="h-3.5 w-3.5" /> Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Drugs tab ─────────────────────────────────────────────────── */}
      {activeTab === 'drugs' && (
        <div className="space-y-4">
          <SearchBar value={drugSearch} onChange={setDrugSearch} placeholder="Search by drug name or ID…" />
          {drugLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : drugError ? (
            <ErrorMessage message={drugError} onRetry={refetchDrugs} />
          ) : filteredDrugs.length === 0 ? (
            <EmptyState icon={Package} title="No drugs found" />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr>
                  <th>Drug Name</th><th>Drug ID</th><th>Manufacturer</th>
                  <th>Mfg Qty</th><th>Remaining</th><th>Expiry</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filteredDrugs.map(d => (
                    <tr key={d.drugId}>
                      <td className="font-medium text-white">{d.drugName}</td>
                      <td className="font-mono text-brand-400">{d.drugId}</td>
                      <td>{d.manufacturerId}</td>
                      <td>{formatQty(d.manufacturedQty)}</td>
                      <td>{formatQty(d.remainingQty)}</td>
                      <td className={d.status === 'Expired' ? 'text-red-400' : ''}>{formatDate(d.expiryDate)}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        {!d.isRecalled && (
                          <button
                            onClick={() => { setRecallModal({ drugId: d.drugId, drugName: d.drugName }); setRecallReason('') }}
                            className="btn-ghost text-xs text-amber-400 !py-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Recall
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={!!confirmModal && confirmModal.action === 'suspend'}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleSuspend}
        title="Suspend Entity"
        message={`Are you sure you want to suspend ${confirmModal?.name}? They will not be able to perform any transactions.`}
        confirmLabel="Suspend"
        danger
      />
      <ConfirmDialog
        isOpen={!!confirmModal && confirmModal.action === 'activate'}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleActivate}
        title="Activate Entity"
        message={`Reactivate ${confirmModal?.name}? They will regain full access.`}
        confirmLabel="Activate"
      />

      <Modal isOpen={!!recallModal} onClose={() => setRecallModal(null)} title="Recall Drug" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300">
            Recalling <strong>{recallModal?.drugName}</strong> ({recallModal?.drugId}) is permanent. The drug cannot be transferred after recall.
          </div>
          <div>
            <label className="label">Recall Reason</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Enter reason…"
              value={recallReason} onChange={e => setRecallReason(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setRecallModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleRecall}
              className="btn-primary !from-amber-600 !to-amber-500">
              Recall Drug
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
