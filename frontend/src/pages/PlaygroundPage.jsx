import { useState } from 'react'
import { useApi } from '../hooks/useApi'

const EXAMPLE_QUERIES = [
  {
    name: 'Users with Posts',
    query: `{
  users {
    id
    fullName
    posts {
      id
      body
    }
  }
}`
  },
  {
    name: 'Deep Nested',
    query: `{
  users {
    id
    fullName
    posts {
      id
      body
      comments {
        id
        body
        author {
          id
          fullName
        }
      }
    }
  }
}`
  },
  {
    name: 'Single User',
    query: `{
  user(id: 1) {
    id
    fullName
    posts {
      id
      body
    }
    following {
      id
      fullName
    }
  }
}`
  },
  {
    name: 'All Posts',
    query: `{
  posts {
    id
    body
    author {
      id
      fullName
    }
    comments {
      id
      body
    }
  }
}`
  }
]

function highlightSQL(sql) {
  if (!sql) return ''
  return sql
    .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|INNER JOIN|ON|AND|OR|IN|AS|ORDER BY|GROUP BY|INSERT|UPDATE|DELETE|INTO|VALUES|SET|LIMIT|COUNT|DISTINCT|NOT|NULL|IS|TRUE|FALSE|UPPER)\b/gi, 
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

const STRATEGIES = [
  { key: 'naive', label: 'Naive GraphQL', cls: 'naive', color: 'red' },
  { key: 'dataloader', label: 'DataLoader', cls: 'dataloader', color: 'blue' },
  { key: 'joinmonster', label: 'Join Monster', cls: 'joinmonster', color: 'green' }
]

export default function PlaygroundPage() {
  const { fetchGraphQL } = useApi()
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0].query)
  const [strategy, setStrategy] = useState('joinmonster')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  async function runQuery() {
    setLoading(true)
    try {
      const data = await fetchGraphQL(strategy, query)
      setResult(data)
      setHistory(prev => [{
        query: query.slice(0, 50) + '...',
        strategy,
        queryCount: data._meta?.queryCount,
        time: data._meta?.executionTimeMs,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10))
    } catch (err) {
      setResult({ errors: [{ message: err.message }] })
    }
    setLoading(false)
  }

  const strat = STRATEGIES.find(s => s.key === strategy)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🧪 Query Playground</h1>
        <p className="page-subtitle">
          Write GraphQL queries, choose a strategy, and inspect the generated SQL and response.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left: Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Strategy Selector */}
          <div className="strategy-tabs">
            {STRATEGIES.map(s => (
              <button 
                key={s.key}
                className={`strategy-tab ${strategy === s.key ? 'active' : ''}`}
                onClick={() => setStrategy(s.key)}
              >
                <span className={`dot ${s.cls}`}></span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Example Queries */}
          <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Examples:</span>
            {EXAMPLE_QUERIES.map((eq, i) => (
              <button 
                key={i}
                className="btn btn-ghost btn-sm"
                onClick={() => setQuery(eq.query)}
              >
                {eq.name}
              </button>
            ))}
          </div>

          {/* Query Editor */}
          <div className="query-editor" style={{ flex: 1 }}>
            <div className="query-editor-header">
              <span className="code-viewer-title">GraphQL Query</span>
              <button 
                className="btn btn-primary btn-sm"
                onClick={runQuery}
                disabled={loading}
              >
                {loading ? '⏳ Running...' : '▶ Execute'}
              </button>
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ minHeight: 300 }}
            />
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="glass-card glass-card-inner">
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                📜 Query History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{h.timestamp}</span>
                    <code style={{ color: 'var(--text-muted)', flex: 1, margin: '0 0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.query}
                    </code>
                    <span className={`badge badge-${STRATEGIES.find(s=>s.key===h.strategy)?.color || 'cyan'}`}>
                      {h.queryCount}q • {h.time?.toFixed(1)}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {result ? (
            <>
              {/* Metrics */}
              {result._meta && (
                <div className="grid-3">
                  <div className="metric-card">
                    <div className="metric-card-label">SQL Queries</div>
                    <div className={`metric-card-value ${strat?.color || 'cyan'}`}>
                      {result._meta.queryCount || '?'}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">Server Time</div>
                    <div className={`metric-card-value ${strat?.color || 'cyan'}`}>
                      {result._meta.executionTimeMs?.toFixed(1) || '?'}
                      <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>ms</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">Client Time</div>
                    <div className="metric-card-value purple">
                      {result._meta.clientTimeMs?.toFixed(1) || '?'}
                      <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SQL Preview (Join Monster) */}
              {result._meta?.sql && (
                <div className="code-viewer">
                  <div className="code-viewer-header">
                    <span className="code-viewer-title">Generated SQL</span>
                    <span className="badge badge-green">Join Monster</span>
                  </div>
                  <div className="code-viewer-body">
                    <pre dangerouslySetInnerHTML={{ __html: highlightSQL(result._meta.sql) }} />
                  </div>
                </div>
              )}

              {/* Response */}
              <div className="json-viewer" style={{ flex: 1 }}>
                <div className="json-viewer-header">
                  <span className="code-viewer-title">Response</span>
                  {result.errors && <span className="badge badge-red">Errors</span>}
                </div>
                <div className="json-viewer-body">
                  <pre dangerouslySetInnerHTML={{ 
                    __html: syntaxHighlightJSON(result.errors || result.data)
                  }} />
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state-icon">🧪</div>
              <p>Write a query and click Execute to see results</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Try different strategies to compare SQL output
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
