import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Hash, Search } from 'lucide-react'
import { getDrugHistory, verifyDrug, getAllEntities } from '../blockchain/contract'
import { normalizeTransaction } from '../utils/helpers'
import { Timeline } from '../components/Timeline'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import { PublicLayout } from '../layouts/PublicLayout'

export function DrugTracking() {
  const [searchParams] = useSearchParams()
  const [drugId,   setDrugId]   = useState(searchParams.get('id') || '')
  const [history,  setHistory]  = useState([])
  const [drugInfo, setDrugInfo] = useState(null)
  const [entityMap,setEntityMap] = useState({})
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [searched, setSearched] = useState(false)

  const handleTrack = async (idOverride) => {
    const id = (idOverride || drugId).trim().toUpperCase()
    if (!id) return
    setDrugId(id)
    setLoading(true)
    setError(null)
    setHistory([])
    setDrugInfo(null)
    setSearched(true)

    try {
      const [hist, info, entities] = await Promise.all([
        getDrugHistory(id),
        verifyDrug(id).catch(() => null),
        getAllEntities().catch(() => []),
      ])

      const normalized = hist.map(normalizeTransaction)
        .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

      // Build entity ID → name map
      const map = {}
      for (const e of entities) {
        map[e.id] = e.name
      }

      setHistory(normalized)
      setDrugInfo(info)
      setEntityMap(map)
    } catch (err) {
      setError('Failed to fetch drug history from the blockchain.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) handleTrack(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium mb-4">
            <Activity className="h-3.5 w-3.5" /> On-Chain Supply History
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Drug Tracking
          </h1>
          <p className="text-dark-400 max-w-lg mx-auto">
            Enter a Drug ID to see every step of its journey through the supply chain, recorded on the blockchain.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-8"
        >
          <div className="relative flex-1">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
            <input
              type="text"
              className="input pl-11 text-base py-3 font-mono"
              placeholder="Enter Drug ID  (e.g. D101)"
              value={drugId}
              onChange={e => setDrugId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
            />
          </div>
          <button
            onClick={() => handleTrack()}
            disabled={loading || !drugId.trim()}
            className="btn-primary px-6 py-3 text-base"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Activity className="h-5 w-5" />}
            {loading ? 'Tracking…' : 'Track'}
          </button>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <LoadingSpinner size="lg" />
            <p className="text-dark-400 text-sm">Querying blockchain…</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {!loading && searched && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Drug info banner */}
              {drugInfo?.exists && (
                <div className="card mb-6 border border-brand-500/20 bg-brand-500/5">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div><span className="text-dark-500 text-xs">Drug</span><p className="text-white font-bold">{drugInfo.drugName}</p></div>
                    <div><span className="text-dark-500 text-xs">Drug ID</span><p className="font-mono text-brand-400 font-semibold">{drugId}</p></div>
                    <div><span className="text-dark-500 text-xs">Manufacturer</span><p className="text-white font-medium">{drugInfo.manufacturerId}</p></div>
                    <div><span className="text-dark-500 text-xs">Status</span>
                      <p className={`font-semibold ${drugInfo.isRecalled ? 'text-amber-400' : drugInfo.isExpired ? 'text-red-400' : 'text-green-400'}`}>
                        {drugInfo.isRecalled ? 'Recalled' : drugInfo.isExpired ? 'Expired' : 'Active'}
                      </p>
                    </div>
                    <div><span className="text-dark-500 text-xs">Transfers</span><p className="text-white font-semibold">{history.length}</p></div>
                  </div>
                </div>
              )}

              {history.length === 0 ? (
                drugInfo && !drugInfo.exists ? (
                  <EmptyState title="Drug not found"
                    message={`No drug with ID "${drugId}" exists on the blockchain.`} />
                ) : (
                  <EmptyState icon={Activity} title="No transfers yet"
                    message="This drug has not been transferred through the supply chain yet." />
                )
              ) : (
                <div>
                  <p className="text-dark-400 text-sm mb-6 text-center">
                    {history.length} blockchain-verified transfer{history.length !== 1 ? 's' : ''} found
                  </p>
                  <Timeline history={history} entityMap={entityMap} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty prompt */}
        {!searched && !loading && (
          <div className="text-center py-12">
            <Activity className="h-16 w-16 text-dark-700 mx-auto mb-4" />
            <p className="text-dark-500">Enter a Drug ID to trace its supply-chain journey.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
