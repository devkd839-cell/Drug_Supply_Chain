import { TrendingUp } from 'lucide-react'

export function StatCard({ label, value, icon: Icon, color = 'blue', sub, loading = false }) {
  const colorMap = {
    blue:   { bg: 'from-blue-600/20 to-blue-500/5',   icon: 'text-blue-400',   border: 'border-blue-500/20'   },
    purple: { bg: 'from-purple-600/20 to-purple-500/5', icon: 'text-purple-400', border: 'border-purple-500/20' },
    green:  { bg: 'from-green-600/20 to-green-500/5',  icon: 'text-green-400',  border: 'border-green-500/20'  },
    amber:  { bg: 'from-amber-600/20 to-amber-500/5',  icon: 'text-amber-400',  border: 'border-amber-500/20'  },
    red:    { bg: 'from-red-600/20 to-red-500/5',      icon: 'text-red-400',    border: 'border-red-500/20'    },
    cyan:   { bg: 'from-cyan-600/20 to-cyan-500/5',    icon: 'text-cyan-400',   border: 'border-cyan-500/20'   },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`card border ${c.border} bg-gradient-to-br ${c.bg} relative overflow-hidden`}>
      {/* decorative blob */}
      <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-20 blur-2xl
        ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' :
          color === 'purple' ? 'bg-purple-500' : color === 'amber' ? 'bg-amber-500' :
          color === 'red' ? 'bg-red-500' : 'bg-cyan-500'}`}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-1">{label}</p>
          {loading ? (
            <div className="h-8 w-24 bg-dark-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
          )}
          {sub && <p className="text-xs text-dark-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-dark-800/60 border border-dark-700/40 ${c.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
