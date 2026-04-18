import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, isAuthenticated, logout } = useApi()
  const navigate = useNavigate()
  const [clientId, setClientId] = useState('carrental-app')
  const [clientSecret, setClientSecret] = useState('cr-secret-2024')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(isAuthenticated())

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await login(clientId, clientSecret)
    setLoading(false)
    if (res.errors) {
      setError(res.errors[0].message)
      return
    }
    if (res.data?.login?.token) {
      setLoggedIn(true)
      window.dispatchEvent(new Event('auth-change'))
      setTimeout(() => navigate('/'), 500)
    }
  }

  function handleLogout() {
    logout()
    setLoggedIn(false)
    window.dispatchEvent(new Event('auth-change'))
  }

  if (loggedIn) {
    return (
      <div className="page login-page">
        <div className="login-card glass-card">
          <div className="login-icon">🔓</div>
          <h1>Authenticated</h1>
          <p className="subtitle">You are logged in and can perform mutations (create, update, delete).</p>
          <button className="btn btn-danger" onClick={handleLogout} style={{width:'100%', marginTop:'1rem'}}>Logout</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page login-page">
      <div className="login-card glass-card">
        <div className="login-icon">🔐</div>
        <h1>API Authentication</h1>
        <p className="subtitle">Enter client credentials to unlock mutations</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin} className="form">
          <div className="form-group">
            <label>Client ID</label>
            <input type="text" required value={clientId} onChange={e => setClientId(e.target.value)}
              placeholder="carrental-app" />
          </div>
          <div className="form-group">
            <label>Client Secret</label>
            <input type="password" required value={clientSecret} onChange={e => setClientSecret(e.target.value)}
              placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Authenticating...' : '🔑 Login'}
          </button>
        </form>

        <div className="login-hint">
          <p><strong>Demo credentials:</strong></p>
          <code>clientId: carrental-app</code><br/>
          <code>clientSecret: cr-secret-2024</code>
        </div>
      </div>
    </div>
  )
}
