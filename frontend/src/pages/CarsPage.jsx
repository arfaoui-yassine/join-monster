import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { getCategoryIcon } from '../utils/icons'

export default function CarsPage() {
  const { gql, isAuthenticated } = useApi()
  const [cars, setCars] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ category_id: null, available: null, search: '' })
  const [showModal, setShowModal] = useState(false)
  const [selectedCar, setSelectedCar] = useState(null)

  async function loadCars() {
    setLoading(true)
    const filterArgs = []
    if (filter.category_id) filterArgs.push(`category_id: ${filter.category_id}`)
    if (filter.available !== null) filterArgs.push(`available: ${filter.available}`)
    if (filter.search) filterArgs.push(`search: "${filter.search}"`)
    const filterStr = filterArgs.length ? `filter: { ${filterArgs.join(', ')} }` : ''

    const res = await gql(`{
      cars(limit: 50, ${filterStr}) {
        id brand model year color fuel_type transmission seats
        price_per_day image_url available license_plate mileage
        category { id name icon }
        agency { id name city }
        averageRating reviewCount
      }
      categories { id name icon carCount }
    }`)
    if (res.data) {
      setCars(res.data.cars)
      setCategories(res.data.categories)
    }
    setLoading(false)
  }

  useEffect(() => { loadCars() }, [filter.category_id, filter.available])

  function handleSearch(e) {
    e.preventDefault()
    loadCars()
  }

  async function deleteCar(id) {
    if (!confirm('Delete this car?')) return
    await gql(`mutation { deleteCar(id: ${id}) { id } }`)
    loadCars()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>🚙 Car Fleet</h1>
        <p className="subtitle">{cars.length} vehicles in fleet</p>
      </div>

      <div className="filter-bar glass-card">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text" placeholder="Search brand, model, color..."
            value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">🔍 Search</button>
        </form>
        <div className="filter-chips">
          <button className={`chip ${filter.category_id === null ? 'active' : ''}`} onClick={() => setFilter(f=>({...f, category_id: null}))}>All</button>
          {categories.map(c => (
            <button key={c.id} className={`chip ${filter.category_id === c.id ? 'active' : ''}`}
              onClick={() => setFilter(f=>({...f, category_id: c.id}))}>
              {getCategoryIcon(c.icon)} {c.name} ({c.carCount})
            </button>
          ))}
        </div>
        <div className="filter-chips">
          <button className={`chip ${filter.available === null ? 'active' : ''}`} onClick={() => setFilter(f=>({...f, available: null}))}>All Status</button>
          <button className={`chip ${filter.available === true ? 'active' : ''}`} onClick={() => setFilter(f=>({...f, available: true}))}>✅ Available</button>
          <button className={`chip ${filter.available === false ? 'active' : ''}`} onClick={() => setFilter(f=>({...f, available: false}))}>🔒 Rented</button>
        </div>
      </div>

      {loading ? <div className="loading-pulse" style={{height:300}}/> : (
        <div className="car-grid">
          {cars.map(car => (
            <div key={car.id} className="car-card glass-card" onClick={() => { setSelectedCar(car); setShowModal(true) }}>
              <div className="car-card-img" style={{ backgroundImage: `url(${car.image_url})` }}>
                <span className={`car-badge ${car.available ? 'available' : 'rented'}`}>
                  {car.available ? '✅ Available' : '🔒 Rented'}
                </span>
                <span className="car-category-badge">{getCategoryIcon(car.category?.icon)} {car.category?.name}</span>
              </div>
              <div className="car-card-body">
                <h3>{car.brand} {car.model}</h3>
                <div className="car-meta">
                  <span>📅 {car.year}</span>
                  <span>🎨 {car.color}</span>
                  <span>⛽ {car.fuel_type}</span>
                  <span>🔧 {car.transmission}</span>
                </div>
                <div className="car-footer">
                  <div className="car-price">{car.price_per_day} <small>MAD/day</small></div>
                  <div className="car-rating">
                    {car.averageRating ? <><span className="stars">{'★'.repeat(Math.round(car.averageRating))}</span> {car.averageRating}</> : <span className="no-rating">No reviews</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedCar && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal glass-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <div className="modal-img" style={{ backgroundImage: `url(${selectedCar.image_url})` }}/>
            <h2>{selectedCar.brand} {selectedCar.model} ({selectedCar.year})</h2>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">Category</span><span>{getCategoryIcon(selectedCar.category?.icon)} {selectedCar.category?.name}</span></div>
              <div className="detail-item"><span className="detail-label">Agency</span><span>📍 {selectedCar.agency?.name}, {selectedCar.agency?.city}</span></div>
              <div className="detail-item"><span className="detail-label">Color</span><span>🎨 {selectedCar.color}</span></div>
              <div className="detail-item"><span className="detail-label">Fuel</span><span>⛽ {selectedCar.fuel_type}</span></div>
              <div className="detail-item"><span className="detail-label">Transmission</span><span>🔧 {selectedCar.transmission}</span></div>
              <div className="detail-item"><span className="detail-label">Seats</span><span>💺 {selectedCar.seats}</span></div>
              <div className="detail-item"><span className="detail-label">Mileage</span><span>🛣️ {selectedCar.mileage?.toLocaleString()} km</span></div>
              <div className="detail-item"><span className="detail-label">License</span><span>🔢 {selectedCar.license_plate}</span></div>
              <div className="detail-item"><span className="detail-label">Price</span><span className="price-highlight">{selectedCar.price_per_day} MAD / day</span></div>
              <div className="detail-item"><span className="detail-label">Status</span><span className={`badge ${selectedCar.available ? 'available' : 'rented'}`}>{selectedCar.available ? '✅ Available' : '🔒 Rented'}</span></div>
            </div>
            {isAuthenticated() && (
              <div className="modal-actions">
                <button className="btn btn-danger" onClick={() => { deleteCar(selectedCar.id); setShowModal(false) }}>🗑️ Delete</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
