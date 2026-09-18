import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle, XCircle, AlertTriangle, Shield, Package, Factory,
         Calendar, Hash, RefreshCw } from 'lucide-react'
import { verifyDrug, getDrugHistory } from '../blockchain/contract'
import { formatDate, formatQty, normalizeTransaction } from '../utils/helpers'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Timeline } from '../components/Timeline'
import { PublicLayout } from '../layouts/PublicLayout'

// ── Status indicator ──────────────────────────────────────────────────────
function VerificationBadge({ ok, warning, label }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border
      ${ok      ? 'bg-green-500/10 border-green-500/30' :
        warning ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-red-500/10   border-red-500/30'}`}>
      {ok      ? <CheckCircle   className="h-5 w-5 text-green-400 shrink-0" /> :
       warning  ? <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" /> :
                  <XCircle       className="h-5 w-5 text-red-400   shrink-0" />}
      <span className={`text-sm font-medium
        ${ok ? 'text-green-300' : warning ? 'text-amber-300' : 'text-red-300'}`}>
        {label}
      </span>
    </div>
  )
}

export function DrugVerification() {
  const [searchParams] = useSearchParams()
  const [drugId,   setDrugId]   = useState(searchParams.get('id') || '')
  const [result,   setResult]   = useState(null)
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [searched, setSearched] = useState(false)

  const handleVerify = async (idOverride) => {
    const id = (idOverride || drugId).trim().toUpperCase()
    if (!id) return
    setDrugId(id)
    setLoading(true)
    setError(null)
    setResult(null)
    setHistory([])
    setSearched(true)
    try {
      const [res, hist] = await Promise.all([
        verifyDrug(id),
        getDrugHistory(id).catch(() => []),
      ])
      setResult(res)
      setHistory(hist.map(normalizeTransaction))
    } catch (err) {
      setError('Failed to query the blockchain. Check the Drug ID and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-search if id param present
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) handleVerify(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const now = Math.floor(Date.now() / 1000)
  const isExpiring = result?.exists && !result.isExpired &&
    (Number(result.expiryDate) - now < 30 * 24 * 60 * 60)

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
            <Shield className="h-3.5 w-3.5" /> Blockchain Verification
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Verify Drug Authenticity
          </h1>
          <p className="text-dark-400 max-w-lg mx-auto">
            Enter a Drug ID to verify its authenticity and view its complete blockchain supply-chain history.
          </p>
        </motion.div>

        {/* Search bar */}
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
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
          </div>
          <button
            onClick={() => handleVerify()}
            disabled={loading || !drugId.trim()}
            className="btn-primary px-6 py-3 text-base"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Search className="h-5 w-5" />}
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex gap-3">
            <XCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {searched && !loading && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Drug not found */}
              {!result.exists ? (
                <div className="card text-center py-12">
                  <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">Drug Not Found</h2>
                  <p className="text-dark-400">
                    No drug with ID <span className="font-mono text-white">{drugId}</span> exists on the blockchain.
                  </p>
                </div>
              ) : (
                <>
                  {/* Verification status grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <VerificationBadge ok label="Drug registered on blockchain" />
                    <VerificationBadge ok label="Manufacturer verified" />
                    <VerificationBadge
                      ok={!result.isExpired && !isExpiring}
                      warning={isExpiring}
                      label={result.isExpired ? 'Drug has expired' : isExpiring ? 'Expiring within 30 days' : 'Expiry valid'}
                    />
                    <VerificationBadge
                      ok={!result.isRecalled}
                      label={result.isRecalled ? `Recalled: ${result.recallReason}` : 'No recall issued'}
                    />
                    <VerificationBadge ok={history.length > 0} warning={history.length === 0}
                      label={history.length > 0 ? `Supply chain: ${history.length} transfer(s)` : 'No transfers yet'} />
                    <VerificationBadge ok={!result.isExpired && !result.isRecalled}
                      warning={isExpiring}
                      label={result.isRecalled ? 'Status: Recalled' : result.isExpired ? 'Status: Expired' : isExpiring ? 'Status: Expiring Soon' : 'Status: Active'} />
                  </div>

                  {/* Drug details */}
                  <div className="card">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2.5 rounded-xl bg-brand-500/20 border border-brand-500/30">
                        <Package className="h-5 w-5 text-brand-400" />
                      </div>
                      <div>
                        <h2 className="font-bold text-white text-lg">{result.drugName}</h2>
                        <p className="font-mono text-dark-400 text-sm">{drugId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-dark-500 text-xs mb-0.5">Manufacturer ID</p>
                        <p className="text-white font-semibold font-mono">{result.manufacturerId}</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs mb-0.5">Mfg Wallet</p>
                        <p className="text-dark-300 font-mono text-xs truncate">{result.manufacturerWallet}</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs mb-0.5">Total Manufactured</p>
                        <p className="text-white font-semibold">{formatQty(result.manufacturedQty)} lots</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs mb-0.5">Remaining at Manufacturer</p>
                        <p className="text-white font-semibold">{formatQty(result.remainingQty)} lots</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs mb-0.5">Manufacturing Date</p>
                        <p className="text-white font-medium">{formatDate(result.manufacturingDate)}</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs mb-0.5">Expiry Date</p>
                        <p className={`font-medium ${result.isExpired ? 'text-red-400' : isExpiring ? 'text-amber-400' : 'text-white'}`}>
                          {formatDate(result.expiryDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Supply chain timeline */}
                  {history.length > 0 && (
                    <div className="card">
                      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-brand-400" />
                        Supply Chain History ({history.length} transfers)
                      </h3>
                      <Timeline history={history} entityMap={{}} />
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty prompt */}
        {!searched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="h-16 w-16 text-dark-700 mx-auto mb-4" />
            <p className="text-dark-500">Enter a Drug ID above to verify its blockchain record.</p>
          </motion.div>
        )}
      </div>
    </PublicLayout>
  )
}
