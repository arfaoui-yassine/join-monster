import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

function CreateModal({ type, onClose, onCreated, users }) {
  const { restMutate } = useApi()
  const [form, setForm] = useState(
    type === 'users' 
      ? { first_name: '', last_name: '', email_address: '' }
      : type === 'posts'
        ? { body: '', author_id: '' }
        : { body: '', post_id: '', author_id: '' }
  )
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (payload.author_id) payload.author_id = parseInt(payload.author_id)
      if (payload.post_id) payload.post_id = parseInt(payload.post_id)
      await restMutate(`/${type}`, 'POST', payload)
      onCreated()
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create {type.slice(0, -1)}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {type === 'users' && (
              <>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={form.first_name} 
                    onChange={e => setForm({...form, first_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={form.last_name}
                    onChange={e => setForm({...form, last_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email_address}
                    onChange={e => setForm({...form, email_address: e.target.value})} required />
                </div>
              </>
            )}
            {type === 'posts' && (
              <>
                <div className="form-group">
                  <label className="form-label">Author</label>
                  <select className="form-select" value={form.author_id}
                    onChange={e => setForm({...form, author_id: e.target.value})} required>
                    <option value="">Select author...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} (ID: {u.id})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Body</label>
                  <textarea className="form-textarea" value={form.body}
                    onChange={e => setForm({...form, body: e.target.value})} required />
                </div>
              </>
            )}
            {type === 'comments' && (
              <>
                <div className="form-group">
                  <label className="form-label">Author</label>
                  <select className="form-select" value={form.author_id}
                    onChange={e => setForm({...form, author_id: e.target.value})} required>
                    <option value="">Select author...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} (ID: {u.id})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Post ID</label>
                  <input className="form-input" type="number" value={form.post_id}
                    onChange={e => setForm({...form, post_id: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Comment Body</label>
                  <textarea className="form-textarea" value={form.body}
                    onChange={e => setForm({...form, body: e.target.value})} required />
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ENTITY_CONFIGS = {
  users: {
    label: 'Users',
    icon: '👤',
    columns: ['id', 'first_name', 'last_name', 'email_address', 'num_legs', 'created_at'],
    graphql: '{ users { id fullName posts { id } comments { id } } }',
    restEndpoint: '/users'
  },
  posts: {
    label: 'Posts',
    icon: '📝',
    columns: ['id', 'body', 'author_id', 'archived', 'created_at'],
    graphql: '{ posts { id body author { fullName } comments { id } } }',
    restEndpoint: '/posts'
  },
  comments: {
    label: 'Comments',
    icon: '💬',
    columns: ['id', 'body', 'post_id', 'author_id', 'archived', 'created_at'],
    graphql: '{ comments { id body author { fullName } } }',
    restEndpoint: '/comments'
  }
}

export default function DataExplorerPage() {
  const { fetchRest, restMutate, fetchGraphQL } = useApi()
  const [activeEntity, setActiveEntity] = useState('users')
  const [data, setData] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [meta, setMeta] = useState(null)
  const [strategy, setStrategy] = useState('rest')

  const config = ENTITY_CONFIGS[activeEntity]

  async function loadData() {
    setLoading(true)
    try {
      if (strategy === 'rest') {
        const result = await fetchRest(config.restEndpoint)
        setData(result.data || [])
        setMeta(result._meta)
      } else {
        const result = await fetchGraphQL(strategy, config.graphql)
        const key = activeEntity
        setData(result.data?.[key] || [])
        setMeta(result._meta)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function loadUsers() {
    try {
      const result = await fetchRest('/users')
      setUsers(result.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { loadData() }, [activeEntity, strategy])
  useEffect(() => { loadUsers() }, [])

  async function handleDelete(id) {
    if (!confirm(`Delete ${activeEntity.slice(0, -1)} #${id}?`)) return
    try {
      await restMutate(`/${activeEntity}/${id}`, 'DELETE')
      loadData()
    } catch (err) { console.error(err) }
  }

  function truncate(str, len = 60) {
    if (!str) return '-'
    const s = String(str)
    return s.length > len ? s.slice(0, len) + '...' : s
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🗃️ Data Explorer</h1>
        <p className="page-subtitle">
          Browse and manage your database entities. Switch strategies to see fetch performance differences.
        </p>
      </div>

      {/* Entity Tabs + Controls */}
      <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
          {Object.entries(ENTITY_CONFIGS).map(([key, cfg]) => (
            <button 
              key={key}
              className={`tab ${activeEntity === key ? 'active' : ''}`}
              onClick={() => setActiveEntity(key)}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
        <div className="flex-gap">
          <div className="strategy-tabs" style={{ border: 'none', background: 'none', padding: 0 }}>
            {[
              { key: 'rest', label: 'REST', cls: 'rest' },
              { key: 'naive', label: 'Naive', cls: 'naive' },
              { key: 'dataloader', label: 'DataLoader', cls: 'dataloader' },
              { key: 'joinmonster', label: 'Join Monster', cls: 'joinmonster' }
            ].map(s => (
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
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            + Create
          </button>
        </div>
      </div>

      {/* Meta info */}
      {meta && (
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          <div className="metric-card">
            <div className="metric-card-label">Strategy</div>
            <div className="metric-card-value cyan" style={{ fontSize: '1rem' }}>
              {meta.strategy || strategy.toUpperCase()}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-card-label">SQL Queries</div>
            <div className={`metric-card-value ${meta.queryCount > 10 ? 'red' : meta.queryCount > 3 ? 'orange' : 'green'}`}>
              {meta.queryCount || '?'}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-card-label">Client Time</div>
            <div className="metric-card-value purple">
              {meta.clientTimeMs || meta.executionTimeMs || '?'}
              <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <span>Loading {config.label}...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No {config.label.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="data-table-container glass-card">
          <table className="data-table">
            <thead>
              <tr>
                {config.columns.map(col => (
                  <th key={col}>{col.replace(/_/g, ' ')}</th>
                ))}
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.id || i}>
                  {config.columns.map(col => (
                    <td key={col}>{truncate(row[col])}</td>
                  ))}
                  <td>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleDelete(row.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ 
        marginTop: '0.75rem', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)',
        textAlign: 'right'
      }}>
        {data.length} records loaded
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateModal 
          type={activeEntity}
          users={users}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadData(); loadUsers(); }}
        />
      )}
    </div>
  )
}
