import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

const STRATEGY_COLORS = {
  naive: 'red',
  dataloader: 'blue',
  joinmonster: 'green'
}

const STRATEGY_LABELS = {
  naive: 'Naive GraphQL',
  dataloader: 'DataLoader',
  joinmonster: 'Join Monster'
}

function highlightSQL(sql) {
  if (!sql) return ''
  return sql
    .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|INNER JOIN|ON|AND|OR|IN|AS|ORDER BY|GROUP BY|INSERT|UPDATE|DELETE|INTO|VALUES|SET|LIMIT|COUNT|DISTINCT|NOT|NULL|IS|TRUE|FALSE)\b/gi, 
      '<span class="sql-keyword">$1</span>')
    .replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>')
    .replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>')
}

function syntaxHighlightJSON(obj) {
  const json = JSON.stringify(obj, null, 2)
  if (!json) return ''
  return json
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>')
}

function PerformanceChart({ results }) {
  if (!results) return null

  const strategies = Object.keys(results)
  const maxQueries = Math.max(...strategies.map(s => results[s].queryCount || 1))
  const maxTime = Math.max(...strategies.map(s => results[s].executionTimeMs || 1))

  return (
    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <div className="glass-card-inner">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>📊 Performance Comparison</h3>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>
          SQL QUERIES EXECUTED
        </p>
        <div className="perf-chart" style={{ padding: 0, marginBottom: '1.5rem' }}>
          {strategies.map(s => (
            <div className="perf-chart-row" key={s}>
              <div className="perf-chart-label">{STRATEGY_LABELS[s]}</div>
              <div className="perf-chart-bar-wrapper">
                <div 
                  className={`perf-chart-bar ${s}`}
                  style={{ width: `${Math.max((results[s].queryCount / maxQueries) * 100, 8)}%` }}
                >
                  {results[s].queryCount}
                </div>
              </div>
              <div className={`perf-chart-value`} style={{ color: `var(--accent-${STRATEGY_COLORS[s]})` }}>
                {results[s].queryCount} queries
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>
          EXECUTION TIME (ms)
        </p>
        <div className="perf-chart" style={{ padding: 0 }}>
          {strategies.map(s => (
            <div className="perf-chart-row" key={s}>
              <div className="perf-chart-label">{STRATEGY_LABELS[s]}</div>
              <div className="perf-chart-bar-wrapper">
                <div 
                  className={`perf-chart-bar ${s}`}
                  style={{ width: `${Math.max((results[s].executionTimeMs / maxTime) * 100, 8)}%` }}
                >
                </div>
              </div>
              <div className={`perf-chart-value`} style={{ color: `var(--accent-${STRATEGY_COLORS[s]})` }}>
                {results[s].executionTimeMs.toFixed(1)}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ComparisonPage() {
  const { compare, fetchQueries } = useApi()
  const [queries, setQueries] = useState({})
  const [selectedQuery, setSelectedQuery] = useState('users-with-posts')
  const [customQuery, setCustomQuery] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeResultTab, setActiveResultTab] = useState('naive')

  useEffect(() => {
    fetchQueries().then(setQueries).catch(console.error)
  }, [])

  async function runComparison() {
    setLoading(true)
    try {
      const data = await compare(
        useCustom ? null : selectedQuery,
        useCustom ? customQuery : null
      )
      setResults(data.results)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📊 Strategy Comparison</h1>
        <p className="page-subtitle">
          Run the same GraphQL query against all strategies and see the performance difference in real-time.
        </p>
      </div>

      {/* Query Selector */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card-inner">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Select Query</h3>
            <label className="flex-gap" style={{ cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={useCustom} 
                onChange={e => setUseCustom(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custom Query</span>
            </label>
          </div>

          {!useCustom ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {Object.entries(queries).map(([key, q]) => (
                <label 
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedQuery === key ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                    border: `1px solid ${selectedQuery === key ? 'rgba(6, 182, 212, 0.2)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input 
                    type="radio" 
                    name="query" 
                    value={key} 
                    checked={selectedQuery === key}
                    onChange={() => setSelectedQuery(key)}
                    style={{ accentColor: 'var(--accent-cyan)', marginTop: '0.2rem' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{q.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.description}</div>
                    <code style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--accent-cyan)',
                      display: 'block',
                      marginTop: '0.35rem',
                      opacity: 0.8
                    }}>
                      {q.graphql.length > 80 ? q.graphql.slice(0, 80) + '...' : q.graphql}
                    </code>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="query-editor" style={{ marginBottom: '1rem' }}>
              <div className="query-editor-header">
                <span className="code-viewer-title">Custom GraphQL Query</span>
              </div>
              <textarea
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                placeholder={'{\n  users {\n    id\n    fullName\n    posts {\n      id\n      body\n    }\n  }\n}'}
              />
            </div>
          )}

          <button 
            className="btn btn-primary btn-lg" 
            onClick={runComparison}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <><span className="loading-spinner" style={{ width: 18, height: 18 }}></span> Running comparison...</>
            ) : (
              '🚀 Run Comparison Across All Strategies'
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          <PerformanceChart results={results} />

          {/* Detail Tabs */}
          <div className="glass-card">
            <div className="glass-card-inner">
              <div className="tabs">
                {Object.keys(results).map(s => (
                  <button 
                    key={s}
                    className={`tab ${activeResultTab === s ? 'active' : ''}`}
                    onClick={() => setActiveResultTab(s)}
                  >
                    <span className={`dot ${s}`} style={{
                      display: 'inline-block',
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: `var(--accent-${STRATEGY_COLORS[s]})`,
                      marginRight: 6
                    }}></span>
                    {STRATEGY_LABELS[s]}
                    <span className="badge" style={{ 
                      marginLeft: 8,
                      background: `rgba(var(--accent-${STRATEGY_COLORS[s]}), 0.1)`,
                      fontSize: '0.7rem'
                    }}>
                      {results[s].queryCount}q
                    </span>
                  </button>
                ))}
              </div>

              {results[activeResultTab] && (
                <div>
                  {/* Metrics Row */}
                  <div className="grid-3" style={{ marginBottom: '1rem' }}>
                    <div className="metric-card">
                      <div className="metric-card-label">SQL Queries</div>
                      <div className={`metric-card-value ${STRATEGY_COLORS[activeResultTab]}`}>
                        {results[activeResultTab].queryCount}
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-card-label">Execution Time</div>
                      <div className={`metric-card-value ${STRATEGY_COLORS[activeResultTab]}`}>
                        {results[activeResultTab].executionTimeMs.toFixed(1)}
                        <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>ms</span>
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-card-label">Strategy</div>
                      <div className={`metric-card-value ${STRATEGY_COLORS[activeResultTab]}`} style={{ fontSize: '1.1rem' }}>
                        {results[activeResultTab].strategy}
                      </div>
                    </div>
                  </div>

                  {/* Response Data */}
                  <div className="json-viewer">
                    <div className="json-viewer-header">
                      <span className="code-viewer-title">Response Data</span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        {JSON.stringify(results[activeResultTab].data).length} bytes
                      </span>
                    </div>
                    <div className="json-viewer-body">
                      <pre dangerouslySetInnerHTML={{ 
                        __html: syntaxHighlightJSON(results[activeResultTab].data)
                      }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
