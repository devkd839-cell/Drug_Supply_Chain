import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'

const ICONS = {
  success: <CheckCircle  className="h-5 w-5 text-green-400 shrink-0" />,
  error:   <XCircle      className="h-5 w-5 text-red-400   shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
  info:    <Info          className="h-5 w-5 text-blue-400  shrink-0" />,
}

const BORDERS = {
  success: 'border-green-500/30 bg-green-500/10',
  error:   'border-red-500/30   bg-red-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  info:    'border-blue-500/30  bg-blue-500/10',
}

function ToastItem({ toast, onRemove }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md
        shadow-lg shadow-black/30 max-w-sm w-full
        ${BORDERS[toast.type] || BORDERS.info}
        animate-in slide-in-from-right-5 fade-in duration-300`}
    >
      {ICONS[toast.type] || ICONS.info}
      <p className="text-sm text-dark-100 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-dark-400 hover:text-white transition-colors shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useWeb3()
  if (!toasts.length) return null
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}
