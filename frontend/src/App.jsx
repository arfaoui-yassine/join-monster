import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ComparisonPage from './pages/ComparisonPage'
import DataExplorerPage from './pages/DataExplorerPage'
import PlaygroundPage from './pages/PlaygroundPage'
import JourneyPage from './pages/JourneyPage'
import './index.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-icon">⚡</span>
          <span>GraphQL Migration</span>
        </Link>
        <ul className="navbar-links">
          <li><NavLink to="/" end className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>🏠 Home</NavLink></li>
          <li><NavLink to="/compare" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>📊 Compare</NavLink></li>
          <li><NavLink to="/explorer" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>🗃️ Data Explorer</NavLink></li>
          <li><NavLink to="/playground" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>🧪 Playground</NavLink></li>
          <li><NavLink to="/journey" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>🎓 Journey</NavLink></li>
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/explorer" element={<DataExplorerPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/journey" element={<JourneyPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
