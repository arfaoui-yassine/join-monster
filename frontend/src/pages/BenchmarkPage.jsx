import { useState } from 'react'

export default function BenchmarkPage() {
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  async function runBenchmark() {
    setLoading(true)
    setShowResults(false)
    setScenarios([])
    try {
      const res = await fetch('/car-rental/benchmark/all')
      const data = await res.json()
      setScenarios(data.scenarios)
      setTimeout(() => setShowResults(true), 100)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  function formatMs(ms) { return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms/1000).toFixed(2)}s` }

  const strategies = [
    { key: 'naive', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', icon: '🐌', label: 'Naive (N+1)', shortLabel: 'Naive' },
    { key: 'dataloader', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: '⚡', label: 'DataLoader', shortLabel: 'DataLoader' },
    { key: 'joinmonster', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', icon: '🚀', label: 'Join Monster', shortLabel: 'Join Monster' }
  ]

  // Compute totals
  const totals = scenarios.length > 0 ? {
    naive: { duration: scenarios.reduce((s, sc) => s + sc.naive.duration, 0), queries: scenarios.reduce((s, sc) => s + sc.naive.queryCount, 0) },
    dataloader: { duration: scenarios.reduce((s, sc) => s + sc.dataloader.duration, 0), queries: scenarios.reduce((s, sc) => s + sc.dataloader.queryCount, 0) },
    joinmonster: { duration: scenarios.reduce((s, sc) => s + sc.joinmonster.duration, 0), queries: scenarios.reduce((s, sc) => s + sc.joinmonster.queryCount, 0) }
  } : null

  return (
    <div className="page benchmark-page">
      <div className="page-header" style={{textAlign:'center', display:'block'}}>
        <h1 style={{textAlign:'center'}}>⚡ Optimization Lab</h1>
        <p className="subtitle" style={{textAlign:'center', maxWidth: 700, margin: '0.5rem auto'}}>
          Compare <strong>Naive N+1</strong> vs <strong>DataLoader</strong> vs <strong>Join Monster</strong> across 3 real-world query scenarios
          on <strong>200 cars, 215 customers, 1500 reservations</strong>
        </p>
      </div>

      <div className="benchmark-launch">
        <button className={`benchmark-btn ${loading ? 'loading' : ''}`} onClick={runBenchmark} disabled={loading}>
          {loading ? <><span className="benchmark-spinner" /> Running All Benchmarks...</> : <>🏁 Run Performance Comparison</>}
        </button>
      </div>

      {/* Strategy Legend */}
      {scenarios.length > 0 && (
        <div className={`strategy-legend ${showResults ? 'pop-in' : ''}`} style={{'--delay':'0ms'}}>
          {strategies.map(s => (
            <div key={s.key} className="legend-item">
              <span className="legend-dot" style={{background: s.color}} />
              <span className="legend-icon">{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scenario Cards */}
      {scenarios.map((sc, si) => {
        const slowest = Math.max(sc.naive.duration, sc.dataloader.duration, sc.joinmonster.duration)
        const fastest = Math.min(sc.naive.duration, sc.dataloader.duration, sc.joinmonster.duration)
        const speedup = (sc.naive.duration / sc.joinmonster.duration).toFixed(1)

        return (
          <div key={sc.id} className={`scenario-card glass-card ${showResults ? 'pop-in' : ''}`} style={{'--delay': `${si * 200}ms`}}>
            <div className="scenario-header">
              <div>
                <h2>{sc.icon} {sc.name}</h2>
                <p className="scenario-desc">{sc.description}</p>
              </div>
              <div className="scenario-speedup">
                <span className="speedup-value">{speedup}x</span>
                <span className="speedup-label">faster</span>
              </div>
            </div>

            <p className="scenario-strength">💡 <em>{sc.strength}</em></p>

            {/* KPI row */}
            <div className="kpi-row">
              {strategies.map((s, i) => {
                const data = sc[s.key]
                const isFastest = data.duration === fastest
                return (
                  <div key={s.key} className={`kpi-mini ${showResults ? 'pop-in' : ''}`} style={{'--delay': `${si * 200 + i * 100 + 200}ms`, '--accent': s.color}}>
                    <div className="kpi-mini-glow" style={{background: s.gradient}} />
                    <div className="kpi-mini-icon">{s.icon}</div>
                    <div className="kpi-mini-label">{s.shortLabel}</div>
                    <div className="kpi-mini-time">{formatMs(data.duration)}</div>
                    <div className="kpi-mini-queries">{data.queryCount} queries</div>
                    {isFastest && <span className="kpi-fast-badge">🏆 Fastest</span>}
                    {!isFastest && <span className="kpi-slow-badge">{(data.duration / fastest).toFixed(1)}x slower</span>}
                    {/* Bar */}
                    <div className="kpi-bar-wrapper" style={{marginTop: '0.5rem'}}>
                      <div className={`kpi-bar ${showResults ? 'animate' : ''}`}
                        style={{'--bar-width': `${(data.duration / slowest) * 100}%`, '--bar-color': s.color, '--bar-delay': `${si * 200 + i * 100 + 400}ms`}} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Grand Total Summary */}
      {totals && (
        <div className={`benchmark-summary glass-card ${showResults ? 'pop-in' : ''}`} style={{'--delay': '800ms'}}>
          <h2>📊 Grand Total — All Scenarios Combined</h2>
          <div className="summary-grid">
            {strategies.map(s => (
              <div key={s.key} className="summary-item">
                <div className="summary-big-number" style={{color: s.color}}>{totals[s.key].queries}</div>
                <div className="summary-label">{s.icon} {s.shortLabel} Queries</div>
                <div className="summary-sub">Total time: {formatMs(totals[s.key].duration)}</div>
              </div>
            ))}
            <div className="summary-item highlight">
              <div className="summary-big-number" style={{color: '#06b6d4'}}>
                {(totals.naive.duration / totals.joinmonster.duration).toFixed(1)}x
              </div>
              <div className="summary-label">Overall Speedup</div>
              <div className="summary-sub">
                {totals.naive.queries} → {totals.joinmonster.queries} queries
              </div>
            </div>
          </div>

          {/* Visual query comparison */}
          <div className="query-comparison">
            <h3>Total SQL Queries Across All Scenarios</h3>
            <div className="query-bars">
              {strategies.map(s => (
                <div key={s.key} className="query-bar-row">
                  <span className="query-bar-label">{s.icon} {s.label}</span>
                  <div className="query-bar-track">
                    <div className={`query-bar-fill ${showResults ? 'animate' : ''}`}
                      style={{'--fill-width': `${(totals[s.key].queries / totals.naive.queries) * 100}%`, '--fill-color': s.color}}>
                      <span className="query-bar-count">{totals[s.key].queries} queries</span>
                    </div>
                  </div>
                  <span className="query-bar-time">{formatMs(totals[s.key].duration)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
