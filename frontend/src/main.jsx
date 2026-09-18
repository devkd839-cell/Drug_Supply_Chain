import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Web3Provider } from './context/Web3Context'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
import './index.css'

/**
 * Try to load the contract address from /deployments.json (written by deploy.js).
 * Falls back gracefully — VITE_CONTRACT_ADDRESS env var is the primary source.
 */
async function loadDeployments() {
  try {
    const res = await fetch('/deployments.json')
    if (res.ok) {
      const data = await res.json()
      if (data?.address) window.__DRUG_CHAIN_ADDRESS__ = data.address
    }
  } catch {
    // Not present yet — deploy the contract first, or set VITE_CONTRACT_ADDRESS in .env
  }
}

loadDeployments().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <ErrorBoundary>
          <Web3Provider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </Web3Provider>
        </ErrorBoundary>
      </BrowserRouter>
    </React.StrictMode>
  )
})
