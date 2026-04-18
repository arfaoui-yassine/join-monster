import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function CustomersPage() {
  const { gql, isAuthenticated } = useApi()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', license_number: '', birth_date: '' })
  const [error, setError] = useState(null)

  async function loadCustomers() {
    setLoading(true)
    const searchArg = search ? `search: "${search}"` : ''
    const res = await gql(`{
      customers(limit: 50, ${searchArg}) {
        id first_name last_name email phone license_number birth_date created_at
        fullName totalReservations totalSpent
      }
    }`)
    if (res.data) setCustomers(res.data.customers)
    setLoading(false)
  }

  useEffect(() => { loadCustomers() }, [])

  function handleSearch(e) { e.preventDefault(); loadCustomers() }

  async function createCustomer(e) {
    e.preventDefault()
    setError(null)
    const res = await gql(`mutation {
      createCustomer(
        first_name: "${form.first_name}"
        last_name: "${form.last_name}"
        email: "${form.email}"
        ${form.phone ? `phone: "${form.phone}"` : ''}
        ${form.license_number ? `license_number: "${form.license_number}"` : ''}
        ${form.birth_date ? `birth_date: "${form.birth_date}"` : ''}
      ) { id first_name last_name }
    }`)
    if (res.errors) { setError(res.errors[0].message); return }
    setShowCreate(false)
    setForm({ first_name: '', last_name: '', email: '', phone: '', license_number: '', birth_date: '' })
    loadCustomers()
  }

  async function deleteCustomer(id) {
    if (!confirm('Delete this customer and all their data?')) return
    await gql(`mutation { deleteCustomer(id: ${id}) { id } }`)
    loadCustomers()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>👥 Customers</h1>
          <p className="subtitle">{customers.length} registered customers</p>
        </div>
        {isAuthenticated() && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Customer</button>
        )}
      </div>

      <form onSubmit={handleSearch} className="search-form" style={{marginBottom: '1.5rem'}}>
        <input type="text" placeholder="Search by name or email..." value={search}
          onChange={e => setSearch(e.target.value)} className="search-input" />
        <button type="submit" className="btn btn-primary">🔍</button>
      </form>

      {loading ? <div className="loading-pulse" style={{height:300}}/> : (
        <div className="glass-card">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>License</th><th>Bookings</th><th>Total Spent</th>{isAuthenticated() && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="mono">{c.id}</td>
                  <td><strong>{c.first_name} {c.last_name}</strong></td>
                  <td className="mono">{c.email}</td>
                  <td className="mono">{c.phone}</td>
                  <td className="mono">{c.license_number}</td>
                  <td className="mono">{c.totalReservations}</td>
                  <td className="mono">{c.totalSpent?.toLocaleString()} MAD</td>
                  {isAuthenticated() && (
                    <td>
                      <button className="btn-sm btn-danger" onClick={() => deleteCustomer(c.id)}>🗑️</button>
                    </td>
                  )}
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
            <h2>👤 New Customer</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={createCustomer} className="form">
              <div className="form-row">
                <div className="form-group"><label>First Name</label><input required value={form.first_name} onChange={e=>setForm(f=>({...f, first_name: e.target.value}))}/></div>
                <div className="form-group"><label>Last Name</label><input required value={form.last_name} onChange={e=>setForm(f=>({...f, last_name: e.target.value}))}/></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" required value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f, phone: e.target.value}))}/></div>
                <div className="form-group"><label>License #</label><input value={form.license_number} onChange={e=>setForm(f=>({...f, license_number: e.target.value}))}/></div>
              </div>
              <div className="form-group"><label>Birth Date</label><input type="date" value={form.birth_date} onChange={e=>setForm(f=>({...f, birth_date: e.target.value}))}/></div>
              <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Create Customer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
