import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function DashboardPage() {
  const { gql } = useApi()
  const [stats, setStats] = useState(null)
  const [recentReservations, setRecentReservations] = useState([])
  const [recentReviews, setRecentReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await gql(`{
        stats { totalCars availableCars totalCustomers totalReservations activeReservations totalRevenue averageRating totalReviews }
        reservations(limit: 5, sortBy: "created_at", sortOrder: DESC) {
          id start_date end_date total_price status
          customer { first_name last_name }
          car { brand model }
        }
        reviews(limit: 5) {
          id rating comment created_at
          customer { first_name last_name }
          car { brand model }
        }
      }`)
      if (res.data) {
        setStats(res.data.stats)
        setRecentReservations(res.data.reservations)
        setRecentReviews(res.data.reviews)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="page"><div className="loading-pulse" style={{height:400}}/></div>

  const statCards = stats ? [
    { icon: '🚗', label: 'Total Cars', value: stats.totalCars, color: '#06b6d4' },
    { icon: '✅', label: 'Available', value: stats.availableCars, color: '#22c55e' },
    { icon: '👥', label: 'Customers', value: stats.totalCustomers, color: '#a855f7' },
    { icon: '📅', label: 'Active Rentals', value: stats.activeReservations, color: '#f59e0b' },
    { icon: '💰', label: 'Revenue (MAD)', value: stats.totalRevenue?.toLocaleString(), color: '#10b981' },
    { icon: '⭐', label: 'Avg Rating', value: stats.averageRating, color: '#eab308' },
    { icon: '📝', label: 'Total Reviews', value: stats.totalReviews, color: '#ec4899' },
    { icon: '📊', label: 'Total Bookings', value: stats.totalReservations, color: '#6366f1' }
  ] : []

  const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', active: '#22c55e', completed: '#6b7280', cancelled: '#ef4444' }

  return (
    <div className="page">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p className="subtitle">AutoLoc Car Rental — Overview</p>
      </div>

      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{'--accent': s.color}}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="glass-card">
          <h2>📅 Recent Reservations</h2>
          <table className="data-table">
            <thead><tr><th>Customer</th><th>Car</th><th>Dates</th><th>Price</th><th>Status</th></tr></thead>
            <tbody>
              {recentReservations.map(r => (
                <tr key={r.id}>
                  <td>{r.customer?.first_name} {r.customer?.last_name}</td>
                  <td>{r.car?.brand} {r.car?.model}</td>
                  <td className="mono">{r.start_date?.slice(0,10)}</td>
                  <td className="mono">{r.total_price} MAD</td>
                  <td><span className="badge" style={{background: statusColors[r.status]}}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card">
          <h2>⭐ Recent Reviews</h2>
          {recentReviews.map(r => (
            <div key={r.id} className="review-item">
              <div className="review-header">
                <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                <span className="review-car">{r.car?.brand} {r.car?.model}</span>
              </div>
              <p className="review-comment">{r.comment}</p>
              <span className="review-author">— {r.customer?.first_name} {r.customer?.last_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
