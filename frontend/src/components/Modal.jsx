import { useEffect } from 'react'
import { X } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'

export function Modal({ isOpen, onClose, title, children, size = 'md', loading = false }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative w-full ${sizes[size]} glass-dark shadow-2xl shadow-black/50 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/60">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : children}
        </div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-dark-300 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`btn-primary ${danger ? '!from-red-600 !to-red-500 hover:!from-red-500 hover:!to-red-400' : ''}`}
        >
          {loading ? <LoadingSpinner size="sm" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
