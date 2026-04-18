import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApi } from './hooks/useApi'
import DashboardPage from './pages/DashboardPage'
import CarsPage from './pages/CarsPage'
import ReservationsPage from './pages/ReservationsPage'
import CustomersPage from './pages/CustomersPage'
import ReviewsPage from './pages/ReviewsPage'
import LoginPage from './pages/LoginPage'
import BenchmarkPage from './pages/BenchmarkPage'
import './index.css'

function Navbar() {
  const { isAuthenticated, logout } = useApi()
  const [loggedIn, setLoggedIn] = useState(isAuthenticated())

  useEffect(() => {
    const check = () => setLoggedIn(isAuthenticated())
    window.addEventListener('storage', check)
    window.addEventListener('auth-change', check)
    return () => { window.removeEventListener('storage', check); window.removeEventListener('auth-change', check) }
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-icon">🚗</span>
          <span>AutoLoc</span>
        </Link>
        <ul className="navbar-links">
          <li><NavLink to="/" end className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>📊 Dashboard</NavLink></li>
          <li><NavLink to="/cars" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>🚙 Cars</NavLink></li>
          <li><NavLink to="/reservations" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>📅 Reservations</NavLink></li>
          <li><NavLink to="/customers" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>👥 Customers</NavLink></li>
          <li><NavLink to="/reviews" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>⭐ Reviews</NavLink></li>
          <li><NavLink to="/benchmark" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>⚡ Benchmark</NavLink></li>
          <li>
            {loggedIn ? (
              <button className="navbar-link" onClick={() => { logout(); setLoggedIn(false); window.dispatchEvent(new Event('auth-change')) }} style={{ border: 'none', cursor: 'pointer', background: 'none' }}>
                🔓 Logout
              </button>
            ) : (
              <NavLink to="/login" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>🔐 Login</NavLink>
            )}
          </li>
        </ul>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/benchmark" element={<BenchmarkPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
