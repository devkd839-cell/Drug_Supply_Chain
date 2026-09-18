import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Search, ArrowRight, Pill, Factory, Truck,
  Store, User, CheckCircle, Lock, Zap, Globe
} from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import { ROLES } from '../blockchain/contract'

// ── Animation variants ────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.6 } },
}
const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

// ── Supply-chain step data ────────────────────────────────────────────────
const STEPS = [
  { icon: Factory, label: 'Manufacturer', id: 'M11', color: 'from-blue-600 to-blue-500',   ring: 'ring-blue-500/30'   },
  { icon: Truck,   label: 'Wholesaler',   id: 'W11', color: 'from-purple-600 to-purple-500', ring: 'ring-purple-500/30' },
  { icon: Store,   label: 'Retailer',     id: 'R11', color: 'from-green-600 to-green-500',   ring: 'ring-green-500/30'  },
  { icon: User,    label: 'Customer',     id: 'C11', color: 'from-amber-500 to-amber-400',   ring: 'ring-amber-500/30'  },
]

const FEATURES = [
  {
    icon: Shield,
    title: 'Tamper-Proof Records',
    desc:  'Every drug transfer is recorded on the Ethereum blockchain — immutable and publicly verifiable.',
    color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Search,
    title: 'Instant Verification',
    desc:  'Anyone can verify a drug authenticity, manufacturer, and supply history using its Drug ID.',
    color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    desc:  'Smart-contract modifiers enforce that only authorised wallets can perform each action.',
    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: Zap,
    title: 'Real-Time Tracking',
    desc:  'Follow a drug batch from manufacturing floor to patient in real time through the supply chain.',
    color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Globe,
    title: 'Decentralised',
    desc:  'No central database. No single point of failure. The contract is the single source of truth.',
    color: 'text-cyan-400',  bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: CheckCircle,
    title: 'Complete Auditability',
    desc:  'Full transaction history stored on-chain. Every quantity change is traceable and timestamped.',
    color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20',
  },
]

// ── Chain node component ──────────────────────────────────────────────────
function ChainNode({ step, index, total }) {
  const Icon = step.icon
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center gap-2"
    >
      <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${step.color}
        shadow-lg ring-2 ${step.ring} ring-offset-2 ring-offset-dark-950`}>
        <Icon className="h-7 w-7 text-white" />
        {/* Pulse ring */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-30 animate-ping`} />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-sm">{step.label}</p>
        <p className="text-dark-400 text-xs font-mono">{step.id}</p>
      </div>
    </motion.div>
  )
}

// ── Arrow between nodes ───────────────────────────────────────────────────
function ChainArrow() {
  return (
    <motion.div variants={fadeUp} className="flex flex-col items-center gap-1 mb-6">
      <div className="w-px h-6 bg-gradient-to-b from-dark-500 to-dark-700" />
      <ArrowRight className="h-4 w-4 text-dark-500 rotate-90" />
      <div className="w-px h-6 bg-gradient-to-b from-dark-700 to-dark-800" />
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export function LandingPage() {
  const { isConnected, isRegistered, role, connect, isConnecting } = useWeb3()
  const navigate = useNavigate()

  const dashboardPath = {
    [ROLES.Manufacturer]: '/manufacturer',
    [ROLES.Wholesaler]:   '/wholesaler',
    [ROLES.Retailer]:     '/retailer',
    [ROLES.Customer]:     '/customer',
  }[role] || '/register'

  const handleCTA = async () => {
    if (!isConnected) {
      await connect()
    } else if (isRegistered) {
      navigate(dashboardPath)
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="bg-dark-950 overflow-x-hidden">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 py-20">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-100" />
        {/* Radial glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
            h-96 w-96 rounded-full bg-brand-600/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-accent-cyan/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-accent-purple/10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
              border border-brand-500/30 bg-brand-500/10 text-brand-300
              text-sm font-medium mb-6"
          >
            <Shield className="h-3.5 w-3.5" />
            Blockchain-Powered Drug Supply Chain
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-4"
          >
            <span className="text-white">Secure. </span>
            <span className="gradient-text">Transparent.</span>
            <br />
            <span className="text-white">Traceable.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-dark-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Track every drug from manufacturer to customer using blockchain technology.
            Every transfer is recorded on-chain — immutable, transparent, and instantly verifiable.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={handleCTA}
              disabled={isConnecting}
              className="btn-primary text-base px-7 py-3 shadow-xl shadow-brand-900/50"
            >
              {isConnecting ? 'Connecting…' :
               !isConnected  ? <><Pill className="h-5 w-5" /> Connect Wallet</> :
               isRegistered  ? <><ArrowRight className="h-5 w-5" /> Go to Dashboard</> :
               'Register Now'}
            </button>
            <Link
              to="/verify"
              className="btn-secondary text-base px-7 py-3"
            >
              <Search className="h-5 w-5" />
              Verify Drug
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-8 mt-16 pt-10 border-t border-dark-800"
          >
            {[
              { val: '100%', label: 'On-Chain Data' },
              { val: '0',    label: 'Central Servers' },
              { val: '4',    label: 'Supply Chain Roles' },
              { val: '∞',    label: 'Audit History' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold gradient-text">{s.val}</p>
                <p className="text-dark-400 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SUPPLY CHAIN VISUAL ────────────────────────────────────── */}
      <section className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-3">
              End-to-End Supply Chain
            </motion.h2>
            <motion.p variants={fadeUp} className="text-dark-400 max-w-xl mx-auto">
              Every drug batch follows a verified, blockchain-recorded path from creation to the patient.
            </motion.p>
          </motion.div>

          {/* Chain animation */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col items-center"
          >
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center w-full max-w-xs">
                <ChainNode step={step} index={i} total={STEPS.length} />
                {i < STEPS.length - 1 && <ChainArrow />}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Why DrugChain?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-dark-400 max-w-xl mx-auto">
              Built on Ethereum smart contracts for trustless, transparent pharmaceutical tracking.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className={`card border ${f.bg} hover:scale-[1.02] transition-transform duration-200`}
                >
                  <div className={`p-2.5 rounded-xl ${f.bg} border w-fit mb-4`}>
                    <Icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-bold text-white mb-3">
              How It Works
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="space-y-4"
          >
            {[
              { n: '01', t: 'Connect MetaMask',       d: 'Link your Ethereum wallet. Your wallet address becomes your identity on-chain.' },
              { n: '02', t: 'Register Your Entity',    d: 'Register as Manufacturer, Wholesaler, Retailer, or Customer. One wallet per entity.' },
              { n: '03', t: 'Manufacture / Receive',   d: 'Manufacturers create drug batches. Each batch gets a unique Drug ID tracked on-chain.' },
              { n: '04', t: 'Transfer Through Chain',  d: 'Supply drugs down the chain. Each transfer updates on-chain inventory atomically.' },
              { n: '05', t: 'Verify Anywhere',         d: 'Enter any Drug ID to see its complete, tamper-proof history from source to patient.' },
            ].map(s => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                className="flex gap-5 items-start glass-dark p-5"
              >
                <div className="text-4xl font-black gradient-text shrink-0 leading-none">{s.n}</div>
                <div>
                  <p className="font-semibold text-white mb-1">{s.t}</p>
                  <p className="text-dark-400 text-sm">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/20 to-accent-cyan/10" />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to trace the chain?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-dark-300 mb-8">
              Connect your MetaMask wallet to get started. No account needed — just your wallet.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleCTA}
                className="btn-primary text-base px-8 py-3"
              >
                <Pill className="h-5 w-5" />
                {!isConnected ? 'Connect Wallet' : isRegistered ? 'Go to Dashboard' : 'Register Now'}
              </button>
              <Link to="/verify" className="btn-secondary text-base px-8 py-3">
                <Search className="h-5 w-5" /> Verify a Drug
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-dark-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-brand-400" />
            <span className="font-bold text-white">Drug<span className="gradient-text">Chain</span></span>
          </div>
          <p className="text-dark-500 text-sm">
            Blockchain-based drug supply chain management. Built on Ethereum.
          </p>
          <div className="flex gap-4">
            <Link to="/verify" className="text-dark-400 hover:text-white text-sm transition-colors">Verify</Link>
            <Link to="/track"  className="text-dark-400 hover:text-white text-sm transition-colors">Track</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
