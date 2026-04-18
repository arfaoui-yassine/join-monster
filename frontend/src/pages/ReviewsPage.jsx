import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function ReviewsPage() {
  const { gql, isAuthenticated } = useApi()
  const [reviews, setReviews] = useState([])
  const [minRating, setMinRating] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ customer_id: '', car_id: '', rating: 5, comment: '' })
  const [error, setError] = useState(null)

  async function loadReviews() {
    setLoading(true)
    const ratingArg = minRating ? `min_rating: ${minRating}` : ''
    const res = await gql(`{
      reviews(limit: 50, ${ratingArg}) {
        id rating comment created_at
        customer { id first_name last_name }
        car { id brand model year }
      }
    }`)
    if (res.data) setReviews(res.data.reviews)
    setLoading(false)
  }

  useEffect(() => { loadReviews() }, [minRating])

  async function createReview(e) {
    e.preventDefault()
    setError(null)
    const res = await gql(`mutation {
      createReview(
        customer_id: ${form.customer_id}
        car_id: ${form.car_id}
        rating: ${form.rating}
        ${form.comment ? `comment: "${form.comment.replace(/"/g, '\\"')}"` : ''}
      ) { id rating }
    }`)
    if (res.errors) { setError(res.errors[0].message); return }
    setShowCreate(false)
    setForm({ customer_id: '', car_id: '', rating: 5, comment: '' })
    loadReviews()
  }

  async function deleteReview(id) {
    if (!confirm('Delete this review?')) return
    await gql(`mutation { deleteReview(id: ${id}) { id } }`)
    loadReviews()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>⭐ Reviews</h1>
          <p className="subtitle">{reviews.length} customer reviews</p>
        </div>
        {isAuthenticated() && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Review</button>
        )}
      </div>

      <div className="filter-chips" style={{marginBottom: '1.5rem'}}>
        <button className={`chip ${minRating === null ? 'active' : ''}`} onClick={() => setMinRating(null)}>All Ratings</button>
        {[5,4,3,2,1].map(r => (
          <button key={r} className={`chip ${minRating === r ? 'active' : ''}`} onClick={() => setMinRating(r)}>
            {'★'.repeat(r)} {r}+
          </button>
        ))}
      </div>

      {loading ? <div className="loading-pulse" style={{height:300}}/> : (
        <div className="reviews-grid">
          {reviews.map(r => (
            <div key={r.id} className="glass-card review-card">
              <div className="review-card-header">
                <div className="review-stars-big">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                {isAuthenticated() && (
                  <button className="btn-sm btn-danger" onClick={() => deleteReview(r.id)}>🗑️</button>
                )}
              </div>
              <h3 className="review-car-name">🚗 {r.car?.brand} {r.car?.model} ({r.car?.year})</h3>
              <p className="review-comment-text">{r.comment || <em>No comment</em>}</p>
              <div className="review-footer">
                <span className="review-author-name">👤 {r.customer?.first_name} {r.customer?.last_name}</span>
                <span className="review-date">{r.created_at?.slice(0,10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal glass-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            <h2>📝 New Review</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={createReview} className="form">
              <div className="form-row">
                <div className="form-group"><label>Customer ID</label><input type="number" required value={form.customer_id} onChange={e=>setForm(f=>({...f, customer_id: e.target.value}))}/></div>
                <div className="form-group"><label>Car ID</label><input type="number" required value={form.car_id} onChange={e=>setForm(f=>({...f, car_id: e.target.value}))}/></div>
              </div>
              <div className="form-group">
                <label>Rating: {form.rating} ★</label>
                <input type="range" min="1" max="5" value={form.rating} onChange={e=>setForm(f=>({...f, rating: parseInt(e.target.value)}))} />
              </div>
              <div className="form-group"><label>Comment</label><textarea rows={3} value={form.comment} onChange={e=>setForm(f=>({...f, comment: e.target.value}))}/></div>
              <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Submit Review</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
