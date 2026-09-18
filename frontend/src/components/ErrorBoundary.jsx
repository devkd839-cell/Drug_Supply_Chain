import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * ErrorBoundary
 * Catches unhandled render errors anywhere in the tree and shows a
 * readable fallback screen instead of a blank page.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log to console so developers can inspect the full stack
    console.error('[ErrorBoundary] Uncaught render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const msg = this.state.error?.message || String(this.state.error || 'Unknown error')

    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="max-w-lg w-full card border border-red-500/30 bg-red-500/5 text-center py-12 px-8">
          <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>

          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-dark-400 text-sm mb-5">
            An unexpected error occurred. This is usually caused by a network issue,
            an incorrect contract address, or MetaMask being locked.
          </p>

          {/* Show the raw error message in a code block */}
          <pre className="text-left text-xs text-red-300 bg-dark-900 border border-dark-700
            rounded-lg px-4 py-3 overflow-auto max-h-32 mb-6 whitespace-pre-wrap break-all">
            {msg}
          </pre>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-secondary"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload page
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-dark-700/40 text-xs text-dark-600 space-y-1">
            <p>Common fixes:</p>
            <ul className="text-left list-disc list-inside space-y-0.5">
              <li>Make sure the Hardhat node is running: <code className="text-dark-400">npx hardhat node</code></li>
              <li>Make sure the contract is deployed: <code className="text-dark-400">npm run deploy</code></li>
              <li>Check MetaMask is on network <code className="text-dark-400">localhost:8545 / Chain 31337</code></li>
              <li>Unlock MetaMask and refresh</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}
