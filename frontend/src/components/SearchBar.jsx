import { Search, X } from 'lucide-react'

export function SearchBar({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-9"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
          aria-label="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function FilterDropdown({ value, onChange, options, label, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="select pr-8 text-sm"
        aria-label={label}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
        <svg className="h-4 w-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
