import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useWeb3 } from './context/Web3Context'
import { ROLES } from './blockchain/contract'
import { PageLoader } from './components/LoadingSpinner'

// ── Pages ─────────────────────────────────────────────────────────────────
import { LandingPage }           from './pages/LandingPage'
import { ConnectWallet }         from './pages/ConnectWallet'
import { Register }              from './pages/Register'
import { ManufacturerDashboard } from './pages/ManufacturerDashboard'
import { WholesalerDashboard }   from './pages/WholesalerDashboard'
import { RetailerDashboard }     from './pages/RetailerDashboard'
import { CustomerDashboard }     from './pages/CustomerDashboard'
import { DrugVerification }      from './pages/DrugVerification'
import { DrugTracking }          from './pages/DrugTracking'
import { AdminDashboard }        from './pages/AdminDashboard'

// ── Require wallet connection ─────────────────────────────────────────────
function RequireWallet({ children }) {
  const { isConnected, isLoading } = useWeb3()
  const location = useLocation()
  if (isLoading) return <PageLoader message="Checking wallet…" />
  if (!isConnected) return <Navigate to="/connect" state={{ from: location }} replace />
  return children
}

// ── Require registration ──────────────────────────────────────────────────
function RequireRegistration({ children }) {
  const { isConnected, isRegistered, isLoading, isEntityLoading } = useWeb3()
  const location = useLocation()
  if (isLoading || isEntityLoading) return <PageLoader message="Loading account…" />
  if (!isConnected)  return <Navigate to="/connect"  state={{ from: location }} replace />
  if (!isRegistered) return <Navigate to="/register" state={{ from: location }} replace />
  return children
}

// ── Require a specific role ───────────────────────────────────────────────
// isEntityLoading is checked so that during the post-registration entity
// refresh there is a loading spinner instead of a redirect to "/" on stale role=0.
function RequireRole({ role, children }) {
  const { isConnected, isRegistered, role: userRole, isLoading, isEntityLoading } = useWeb3()
  const location = useLocation()
  if (isLoading || isEntityLoading) return <PageLoader message="Loading account…" />
  if (!isConnected)  return <Navigate to="/connect"  state={{ from: location }} replace />
  if (!isRegistered) return <Navigate to="/register" state={{ from: location }} replace />
  if (userRole !== role) return <Navigate to="/" replace />
  return children
}

// ── Admin only ────────────────────────────────────────────────────────────
function RequireAdmin({ children }) {
  const { account, isLoading, isEntityLoading } = useWeb3()
  const contractOwner = import.meta.env.VITE_ADMIN_ADDRESS || ''
  if (isLoading || isEntityLoading) return <PageLoader message="Loading account…" />
  if (contractOwner && account?.toLowerCase() !== contractOwner.toLowerCase()) {
    return <Navigate to="/" replace />
  }
  return children
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"        element={<LandingPage />} />
      <Route path="/connect" element={<ConnectWallet />} />
      <Route path="/verify"  element={<DrugVerification />} />
      <Route path="/track"   element={<DrugTracking />} />

      {/* Registration (wallet required, but unregistered is fine here) */}
      <Route path="/register" element={
        <RequireWallet><Register /></RequireWallet>
      } />

      {/* Manufacturer */}
      <Route path="/manufacturer/*" element={
        <RequireRole role={ROLES.Manufacturer}><ManufacturerDashboard /></RequireRole>
      } />

      {/* Wholesaler */}
      <Route path="/wholesaler/*" element={
        <RequireRole role={ROLES.Wholesaler}><WholesalerDashboard /></RequireRole>
      } />

      {/* Retailer */}
      <Route path="/retailer/*" element={
        <RequireRole role={ROLES.Retailer}><RetailerDashboard /></RequireRole>
      } />

      {/* Customer */}
      <Route path="/customer/*" element={
        <RequireRole role={ROLES.Customer}><CustomerDashboard /></RequireRole>
      } />

      {/* Admin */}
      <Route path="/admin/*" element={
        <RequireRegistration><AdminDashboard /></RequireRegistration>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
