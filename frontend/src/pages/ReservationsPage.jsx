import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function ReservationsPage() {
  const { gql, isAuthenticated } = useApi()
  const [reservations, setReservations] = useState([])
  const [statusFilter, setStatusFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ customer_id: '', car_id: '', start_date: '', end_date: '', notes: '' })
  const [error, setError] = useState(null)

  async function loadReservations() {
    setLoading(true)
    const statusArg = statusFilter ? `status: ${statusFilter.toUpperCase()}` : ''
    const res = await gql(`{
      reservations(limit: 50, ${statusArg}) {
        id start_date end_date total_price status notes created_at days
        customer { id first_name last_name email }
        car { id brand model year price_per_day category { name } }
      }
    }`)
    if (res.data) setReservations(res.data.reservations)
    setLoading(false)
  }

  useEffect(() => { loadReservations() }, [statusFilter])

  async function updateStatus(id, newStatus) {
    const res = await gql(`mutation { updateReservationStatus(id: ${id}, status: ${newStatus.toUpperCase()}) { id status } }`)
    if (res.errors) { alert(res.errors[0].message); return }
    loadReservations()
  }

  async function cancelReservation(id) {
    if (!confirm('Cancel this reservation?')) return
    const res = await gql(`mutation { cancelReservation(id: ${id}) { id status } }`)
    if (res.errors) { alert(res.errors[0].message); return }
    loadReservations()
  }

  async function createReservation(e) {
    e.preventDefault()
    setError(null)
    const res = await gql(`mutation {
      createReservation(
        customer_id: ${form.customer_id}
        car_id: ${form.car_id}
        start_date: "${form.start_date}"
        end_date: "${form.end_date}"
        ${form.notes ? `notes: "${form.notes}"` : ''}
      ) { id total_price status }
    }`)
    if (res.errors) { setError(res.errors[0].message); return }
    setShowCreate(false)
    setForm({ customer_id: '', car_id: '', start_date: '', end_date: '', notes: '' })
    loadReservations()
  }

  const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', active: '#22c55e', completed: '#6b7280', cancelled: '#ef4444' }
  const statuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled']
  const transitions = { pending: ['confirmed', 'cancelled'], confirmed: ['active', 'cancelled'], active: ['completed', 'cancelled'] }

  const counts = {}
  statuses.forEach(s => counts[s] = reservations.filter(r => r.status === s).length)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>📅 Reservations</h1>
          <p className="subtitle">{reservations.length} reservations</p>
        </div>
        {isAuthenticated() && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Reservation</button>
        )}
      </div>

      <div className="filter-chips" style={{marginBottom: '1.5rem'}}>
        <button className={`chip ${statusFilter === null ? 'active' : ''}`} onClick={() => setStatusFilter(null)}>
          All ({reservations.length})
        </button>
        {statuses.map(s => (
          <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)} style={{'--chip-color': statusColors[s]}}>
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {loading ? <div className="loading-pulse" style={{height:300}}/> : (
        <div className="glass-card">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Customer</th><th>Car</th><th>Start</th><th>End</th><th>Days</th><th>Total</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{r.customer?.first_name} {r.customer?.last_name}</td>
                  <td>{r.car?.brand} {r.car?.model} ({r.car?.year})</td>
                  <td className="mono">{r.start_date?.slice(0,10)}</td>
                  <td className="mono">{r.end_date?.slice(0,10)}</td>
                  <td className="mono">{r.days}</td>
                  <td className="mono">{r.total_price} MAD</td>
                  <td><span className="badge" style={{ background: statusColors[r.status] }}>{r.status}</span></td>
                  <td>
                    {isAuthenticated() && transitions[r.status] && (
                      <div className="action-btns">
                        {transitions[r.status].map(next => (
                          <button key={next} className="btn-sm" style={{background: statusColors[next]}}
                            onClick={() => next === 'cancelled' ? cancelReservation(r.id) : updateStatus(r.id, next)}>
                            {next}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal glass-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            <h2>📝 New Reservation</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={createReservation} className="form">
              <div className="form-group">
                <label>Customer ID</label>
                <input type="number" required value={form.customer_id} onChange={e => setForm(f=>({...f, customer_id: e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Car ID</label>
                <input type="number" required value={form.car_id} onChange={e => setForm(f=>({...f, car_id: e.target.value}))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm(f=>({...f, start_date: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" required value={form.end_date} onChange={e => setForm(f=>({...f, end_date: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f=>({...f, notes: e.target.value}))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Create Reservation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
