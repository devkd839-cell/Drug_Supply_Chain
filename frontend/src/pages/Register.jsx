import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, Wallet, CheckCircle, AlertCircle, ChevronRight,
  Factory, Truck, Store, User, Hash,
  Tag, Phone, Mail, MapPin, Building, Globe, FileText,
  RefreshCw, ArrowRight
} from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import { registerEntity, parseContractError, ROLES } from '../blockchain/contract'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { shortenAddress } from '../utils/helpers'

// ── Role config ───────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  {
    value:     ROLES.Manufacturer,
    label:     'Manufacturer',
    icon:      Factory,
    desc:      'Create and supply drug batches to wholesalers',
    color:     'blue',
    idPrefix:  'M',
    idExample: 'M11',
  },
  {
    value:     ROLES.Wholesaler,
    label:     'Wholesaler',
    icon:      Truck,
    desc:      'Receive from manufacturers, distribute to retailers',
    color:     'purple',
    idPrefix:  'W',
    idExample: 'W11',
  },
  {
    value:     ROLES.Retailer,
    label:     'Retailer',
    icon:      Store,
    desc:      'Receive from wholesalers, dispense to customers',
    color:     'green',
    idPrefix:  'R',
    idExample: 'R11',
  },
  {
    value:     ROLES.Customer,
    label:     'Customer',
    icon:      User,
    desc:      'Receive and track your medicines',
    color:     'amber',
    idPrefix:  'C',
    idExample: 'C11',
  },
]

const COLOR_CLASSES = {
  blue:   { border: 'border-blue-500',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   iconBg: 'bg-blue-500/20'   },
  purple: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
  green:  { border: 'border-green-500',  bg: 'bg-green-500/10',  text: 'text-green-400',  iconBg: 'bg-green-500/20'  },
  amber:  { border: 'border-amber-500',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  iconBg: 'bg-amber-500/20'  },
}

const ROLE_EXTRA_FIELDS = {
  [ROLES.Manufacturer]: [
    { key: 'company',  label: 'Company / Organisation',    icon: Building,  placeholder: 'e.g. ABC Pharmaceuticals Ltd', required: false },
    { key: 'license',  label: 'Manufacturing License No',  icon: FileText,  placeholder: 'e.g. MFG-2024-001',            required: false },
    { key: 'location', label: 'Facility Location',         icon: MapPin,    placeholder: 'e.g. Karachi, Pakistan',        required: false },
    { key: 'email',    label: 'Contact Email',             icon: Mail,      placeholder: 'e.g. info@abcpharma.com',       required: false },
    { key: 'phone',    label: 'Contact Phone',             icon: Phone,     placeholder: 'e.g. +92-21-1234567',           required: false },
  ],
  [ROLES.Wholesaler]: [
    { key: 'company',   label: 'Company / Organisation',   icon: Building,  placeholder: 'e.g. XYZ Distribution Ltd',    required: false },
    { key: 'region',    label: 'Distribution Region',      icon: Globe,     placeholder: 'e.g. Sindh, Punjab',            required: false },
    { key: 'warehouse', label: 'Warehouse Address',        icon: MapPin,    placeholder: 'e.g. Warehouse #5, Industrial', required: false },
    { key: 'email',     label: 'Contact Email',            icon: Mail,      placeholder: 'e.g. ops@xyzdist.com',          required: false },
    { key: 'phone',     label: 'Contact Phone',            icon: Phone,     placeholder: 'e.g. +92-42-7654321',           required: false },
  ],
  [ROLES.Retailer]: [
    { key: 'pharmacy', label: 'Pharmacy / Store Name',     icon: Building,  placeholder: 'e.g. City Pharmacy',            required: false },
    { key: 'address',  label: 'Shop Address',              icon: MapPin,    placeholder: 'e.g. 12 Main Rd, Lahore',       required: false },
    { key: 'license',  label: 'Retail Drug License',       icon: FileText,  placeholder: 'e.g. RTL-2024-055',             required: false },
    { key: 'email',    label: 'Contact Email',             icon: Mail,      placeholder: 'e.g. city@pharmacy.com',        required: false },
    { key: 'phone',    label: 'Contact Phone',             icon: Phone,     placeholder: 'e.g. +92-51-9876543',           required: false },
  ],
  [ROLES.Customer]: [
    { key: 'dob',     label: 'Date of Birth',              icon: Tag,       placeholder: 'e.g. 01 Jan 1990', type: 'date', required: false },
    { key: 'address', label: 'Home Address',               icon: MapPin,    placeholder: 'e.g. 5 Park Lane, Islamabad',   required: false },
    { key: 'email',   label: 'Email Address',              icon: Mail,      placeholder: 'e.g. john@email.com',           required: false },
    { key: 'phone',   label: 'Phone Number',               icon: Phone,     placeholder: 'e.g. +92-300-1234567',          required: false },
  ],
}

const ROLE_REDIRECTS = {
  [ROLES.Manufacturer]: '/manufacturer',
  [ROLES.Wholesaler]:   '/wholesaler',
  [ROLES.Retailer]:     '/retailer',
  [ROLES.Customer]:     '/customer',
}

const BLANK_FORM = { name: '', id: '' }

// ── Step dots ─────────────────────────────────────────────────────────────
function StepDot({ n, active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all
        ${done   ? 'border-green-500 bg-green-500/20 text-green-400'  :
          active ? 'border-brand-500 bg-brand-500/20 text-brand-300' :
                   'border-dark-600  bg-dark-800     text-dark-500'}`}>
        {done ? <CheckCircle className="h-4 w-4" /> : n}
      </div>
      <span className={`text-[10px] font-medium whitespace-nowrap
        ${active ? 'text-brand-300' : done ? 'text-green-400' : 'text-dark-500'}`}>
        {label}
      </span>
    </div>
  )
}

function StepLine({ done }) {
  return (
    <div className={`flex-1 h-0.5 mx-1 mb-5 rounded transition-all
      ${done ? 'bg-green-500/40' : 'bg-dark-700'}`} />
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────
function DynamicField({ icon: Icon, label, sublabel, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-dark-300 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-dark-500" />
        {label}
        {required && <span className="text-red-400 text-xs ml-0.5">*</span>}
        {sublabel && <span className="text-dark-600 font-normal text-xs ml-1">— {sublabel}</span>}
      </label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export function Register() {
  const {
    account, isConnected, isRegistered, isEntityLoading,
    role: currentRole, connect, chooseAccount, refreshEntity, addToast,
  } = useWeb3()
  const navigate = useNavigate()

  const [step,      setStep]      = useState(1)
  const [selRole,   setSelRole]   = useState(null)
  const [form,      setForm]      = useState(BLANK_FORM)
  const [isPending, setPending]   = useState(false)
  const [txHash,    setTxHash]    = useState(null)
  const [error,     setError]     = useState(null)

  // ── Reset form whenever the connected wallet changes ──────────────────
  // This is the key fix: switching MetaMask accounts clears all stale state
  // so the new wallet gets a fresh form and no leftover error messages.
  const prevAccount = useRef(account)
  useEffect(() => {
    if (prevAccount.current !== account) {
      prevAccount.current = account
      setStep(1)
      setSelRole(null)
      setForm(BLANK_FORM)
      setPending(false)
      setError(null)
      setTxHash(null)
    }
  }, [account])

  // ── If already registered, redirect to dashboard ──────────────────────
  useEffect(() => {
    if (isRegistered && !isEntityLoading && currentRole !== ROLES.None) {
      navigate(ROLE_REDIRECTS[currentRole] || '/', { replace: true })
    }
  }, [isRegistered, isEntityLoading, currentRole, navigate])

  // ── Handlers ──────────────────────────────────────────────────────────
  const selectRole = (opt) => {
    setSelRole(opt)
    setForm(f => ({ ...f, id: opt.idPrefix }))
    setError(null)
    setStep(2)
  }

  const goBack = () => { setStep(1); setError(null) }
  const updateField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!selRole)               { setError('Please select a role.');                      return }
    if (!form.name.trim())      { setError('Name is required.');                          return }
    if (!form.id.trim())        { setError('Entity ID is required.');                     return }
    if (form.id.trim().length < 2) { setError('Entity ID must be at least 2 characters.'); return }

    setPending(true)
    addToast('Waiting for MetaMask confirmation…', 'info', 4000)

    try {
      const receipt = await registerEntity(
        form.name.trim(),
        form.id.trim().toUpperCase(),
        selRole.value
      )
      setTxHash(receipt?.hash || null)
      addToast('Registration successful! Loading your dashboard…', 'success', 6000)
      await refreshEntity()
      setStep(3)
      setTimeout(() => navigate(ROLE_REDIRECTS[selRole.value] || '/', { replace: true }), 2200)
    } catch (err) {
      const msg = parseContractError(err)
      setError(msg)
      addToast(msg, 'error', 8000)
    } finally {
      setPending(false)
    }
  }

  // ── Show a loader while entity status is being confirmed ──────────────
  if (isEntityLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-dark-400 text-sm">Checking registration status…</p>
      </div>
    )
  }

  // ── Not connected ──────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-4">
        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700">
          <Wallet className="h-10 w-10 text-dark-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1">Connect your wallet first</h2>
          <p className="text-dark-400 text-sm">You need MetaMask to register on DrugChain.</p>
        </div>
        <button onClick={connect} className="btn-primary">
          <Wallet className="h-4 w-4" /> Connect MetaMask
        </button>
      </div>
    )
  }

  // ── Success screen ─────────────────────────────────────────────────────
  if (step === 3) {
    const c = selRole ? COLOR_CLASSES[selRole.color] : COLOR_CLASSES.blue
    const Icon = selRole?.icon || CheckCircle
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="card max-w-md w-full text-center py-12 px-8"
        >
          <div className={`h-20 w-20 rounded-2xl ${c.iconBg} border ${c.border}/40
            mx-auto mb-5 flex items-center justify-center`}>
            <Icon className={`h-10 w-10 ${c.text}`} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Complete!</h2>
          <p className="text-dark-400 mb-1">
            Welcome, <span className="text-white font-semibold">{form.name}</span>
          </p>
          <p className={`text-sm font-semibold ${c.text} mb-1`}>
            {selRole?.label} · {form.id.toUpperCase()}
          </p>
          <p className="text-dark-500 text-xs mb-6">Redirecting to your dashboard…</p>
          {txHash && (
            <p className="font-mono text-[10px] text-dark-600 break-all mb-4">Tx: {txHash}</p>
          )}
          <LoadingSpinner className="mx-auto" />
        </motion.div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[85vh] flex items-start justify-center px-4 py-10">
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
        h-96 w-96 rounded-full bg-brand-600/8 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-2xl"
      >
        <div className="glass-dark shadow-2xl shadow-black/50 overflow-hidden">

          {/* ── Top bar ─────────────────────────────────────────────── */}
          <div className="px-6 pt-6 pb-5 border-b border-dark-700/40">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-brand-500/20 border border-brand-500/30">
                <UserPlus className="h-5 w-5 text-brand-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Register on DrugChain</h1>
                <p className="text-dark-400 text-xs">One-time blockchain registration per wallet</p>
              </div>
            </div>
            {/* Step indicator */}
            <div className="flex items-center">
              <StepDot n={1} active={step === 1} done={step > 1} label="Choose Role" />
              <StepLine done={step > 1} />
              <StepDot n={2} active={step === 2} done={step > 2} label="Your Details" />
              <StepLine done={step > 2} />
              <StepDot n={3} active={step === 3} done={false}  label="Complete" />
            </div>
          </div>

          {/* ── Wallet pill ─────────────────────────────────────────── */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/80 border border-dark-700">
              <Wallet className="h-3.5 w-3.5 text-dark-400 shrink-0" />
              <span className="font-mono text-xs text-dark-300 truncate flex-1">{account}</span>
              <span className="flex items-center gap-1 text-[10px] text-green-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Connected
              </span>
              {/* Switch account button — triggers MetaMask account picker */}
              <button
                type="button"
                onClick={async () => {
                  try { await chooseAccount() }
                  catch { /* dismissed */ }
                }}
                className="ml-1 text-[10px] text-dark-400 hover:text-brand-400
                  flex items-center gap-1 transition-colors shrink-0"
                title="Switch to a different MetaMask account"
              >
                <RefreshCw className="h-3 w-3" /> Switch
              </button>
            </div>
          </div>

          {/* ── Body ────────────────────────────────────────────────── */}
          <div className="px-6 py-5">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Role cards ──────────────────────────────── */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                  <p className="text-sm text-dark-300 mb-4 font-medium">
                    Select the role that describes you in the supply chain:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROLE_OPTIONS.map(opt => {
                      const c    = COLOR_CLASSES[opt.color]
                      const Icon = opt.icon
                      return (
                        <button key={opt.value} type="button" onClick={() => selectRole(opt)}
                          className="group relative p-4 rounded-xl border-2 text-left transition-all
                            duration-200 hover:scale-[1.02] border-dark-600 bg-dark-800/80
                            hover:border-opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500">
                          <div className={`inline-flex p-2 rounded-lg ${c.iconBg} mb-3`}>
                            <Icon className={`h-5 w-5 ${c.text}`} />
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-white text-sm">{opt.label}</p>
                            <ChevronRight className="h-4 w-4 text-dark-500 group-hover:text-white transition-colors" />
                          </div>
                          <p className="text-dark-400 text-xs mt-1 leading-relaxed">{opt.desc}</p>
                          <div className={`mt-2 inline-flex items-center text-[10px] font-mono
                            px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>
                            ID format: {opt.idExample}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Details form ────────────────────────────── */}
              {step === 2 && selRole && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>

                  {/* Role badge + change button */}
                  {(() => {
                    const c    = COLOR_CLASSES[selRole.color]
                    const Icon = selRole.icon
                    return (
                      <div className={`flex items-center gap-3 p-3 rounded-xl
                        border ${c.border}/40 ${c.bg} mb-5`}>
                        <div className={`p-2 rounded-lg ${c.iconBg}`}>
                          <Icon className={`h-4 w-4 ${c.text}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${c.text}`}>{selRole.label}</p>
                          <p className="text-dark-400 text-xs">{selRole.desc}</p>
                        </div>
                        <button type="button" onClick={goBack}
                          className="text-xs text-dark-400 hover:text-white transition-colors underline">
                          Change
                        </button>
                      </div>
                    )
                  })()}

                  {/* Error banner */}
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-300 text-sm">{error}</p>
                        {/* If the error is "already registered", guide user to switch accounts */}
                        {error.toLowerCase().includes('already registered') && (
                          <button type="button" onClick={async () => {
                            setError(null)
                            try { await chooseAccount() } catch { /* dismissed */ }
                          }}
                            className="mt-2 flex items-center gap-1.5 text-xs text-brand-400
                              hover:text-brand-300 transition-colors underline">
                            <RefreshCw className="h-3 w-3" />
                            Switch to a different MetaMask account
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Required fields */}
                    <DynamicField icon={Tag} label="Full Name"
                      sublabel="Your name or organisation name" required>
                      <input type="text" className="input" value={form.name}
                        disabled={isPending} autoFocus
                        placeholder={
                          selRole.value === ROLES.Manufacturer ? 'e.g. ABC Pharmaceuticals' :
                          selRole.value === ROLES.Wholesaler   ? 'e.g. XYZ Distribution'    :
                          selRole.value === ROLES.Retailer     ? 'e.g. City Pharmacy'        :
                                                                  'e.g. John Smith'
                        }
                        onChange={e => updateField('name', e.target.value)} />
                    </DynamicField>

                    <DynamicField icon={Hash} label="Entity ID"
                      sublabel={`Unique — convention starts with "${selRole.idPrefix}" (e.g. ${selRole.idExample})`}
                      required>
                      <input type="text" className="input font-mono tracking-wider"
                        placeholder={selRole.idExample} value={form.id}
                        disabled={isPending} maxLength={10}
                        onChange={e => updateField('id', e.target.value.toUpperCase())} />
                    </DynamicField>

                    {/* Optional role-specific fields */}
                    {ROLE_EXTRA_FIELDS[selRole.value]?.length > 0 && (
                      <div>
                        <p className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-3">
                          Additional Information{' '}
                          <span className="text-dark-600 normal-case font-normal">(optional)</span>
                        </p>
                        <div className="space-y-3">
                          {ROLE_EXTRA_FIELDS[selRole.value].map(field => {
                            const FIcon = field.icon
                            return (
                              <DynamicField key={field.key} icon={FIcon}
                                label={field.label} required={field.required}>
                                <input type={field.type || 'text'} className="input"
                                  placeholder={field.placeholder}
                                  value={form[field.key] || ''}
                                  disabled={isPending}
                                  onChange={e => updateField(field.key, e.target.value)} />
                              </DynamicField>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-dark-600 flex gap-1.5 items-start pt-1">
                      <span className="shrink-0 mt-0.5">ℹ</span>
                      Only <span className="text-dark-400">Name, Entity ID and Role</span> are
                      stored on the blockchain. Additional fields are for your reference only.
                    </p>

                    <button type="submit"
                      disabled={isPending || !form.name.trim() || !form.id.trim()}
                      className="btn-primary w-full justify-center py-3 text-base !mt-5">
                      {isPending
                        ? <><LoadingSpinner size="sm" /> Registering on Blockchain…</>
                        : <><UserPlus className="h-5 w-5" /> Register as {selRole.label}</>
                      }
                    </button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 pt-2 border-t border-dark-700/40">
            <p className="text-xs text-dark-600 text-center">
              This transaction is signed by MetaMask and recorded permanently on the blockchain.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
