// Shared UI Components

export function PageHeader({ icon, title, subtitle, badge }) {
  return (
    <div className="border-b border-border px-8 py-6 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-xl text-accent">{icon}</span>
          <h1 className="font-display font-700 text-xl text-text tracking-wide">{title}</h1>
        </div>
        <p className="font-body text-sm text-text-dim ml-9">{subtitle}</p>
      </div>
      {badge && (
        <div className="font-mono text-xs text-text-dim border border-border px-3 py-1.5 rounded-sm">
          {badge}
        </div>
      )}
    </div>
  )
}

export function StatusBadge({ status, label }) {
  const colors = {
    loading: 'text-warn border-warn border-opacity-30 bg-warn bg-opacity-5',
    success: 'text-success border-success border-opacity-30 bg-success bg-opacity-5',
    error: 'text-danger border-danger border-opacity-30 bg-danger bg-opacity-5',
    idle: 'text-text-dim border-border bg-surface',
  }
  return (
    <span className={`tag ${colors[status] || colors.idle}`}>{label}</span>
  )
}

export function ScoreBar({ score, color = 'accent' }) {
  const colorMap = {
    accent: 'linear-gradient(90deg, #00d4ff, #0099bb)',
    success: 'linear-gradient(90deg, #00ff88, #00cc66)',
    warn: 'linear-gradient(90deg, #ffaa00, #ff8800)',
  }
  return (
    <div className="score-bar">
      <div
        className="score-fill"
        style={{ width: `${score}%`, background: colorMap[color] || colorMap.accent }}
      />
    </div>
  )
}

export function CategoryTag({ category }) {
  const cls = `label-${category}`
  return <span className={`tag ${cls}`}>{category}</span>
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin"></div>
      <span className="font-mono text-xs text-accent loading-dots">处理中</span>
    </div>
  )
}

export function EmptyState({ icon, message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="font-mono text-4xl text-muted mb-4">{icon}</div>
      <div className="font-body text-sm text-text-dim mb-1">{message}</div>
      {sub && <div className="font-mono text-xs text-muted">{sub}</div>}
    </div>
  )
}

export function InfoRow({ label, value, mono = false }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border border-opacity-50 last:border-0">
      <span className="font-mono text-xs text-text-dim">{label}</span>
      <span className={`${mono ? 'font-mono' : 'font-body'} text-xs text-text text-right max-w-48 truncate`}>{value}</span>
    </div>
  )
}
