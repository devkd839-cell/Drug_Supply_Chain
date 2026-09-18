import { PackageOpen } from 'lucide-react'

export function EmptyState({ icon: Icon = PackageOpen, title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-2xl bg-dark-800/60 border border-dark-700/40 mb-4">
        <Icon className="h-10 w-10 text-dark-500" />
      </div>
      <h3 className="text-dark-200 font-semibold mb-1">{title}</h3>
      {message && <p className="text-dark-400 text-sm max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <p className="text-red-400 text-sm text-center max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Try again
        </button>
      )}
    </div>
  )
}
