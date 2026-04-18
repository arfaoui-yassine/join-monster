const API_BASE = ''

export function useApi() {
  let authToken = localStorage.getItem('cr_token')

  function setToken(token) {
    authToken = token
    if (token) localStorage.setItem('cr_token', token)
    else localStorage.removeItem('cr_token')
  }

  function getToken() {
    return authToken || localStorage.getItem('cr_token')
  }

  function isAuthenticated() {
    return !!getToken()
  }

  async function gql(query, variables = {}) {
    const headers = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_BASE}/car-rental/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    })
    const data = await res.json()
    if (data.errors && data.errors.length > 0) {
      // If auth error, clear token
      if (data.errors[0].message.includes('Authentication required')) {
        console.warn('Auth required')
      }
    }
    return data
  }

  async function login(clientId, clientSecret) {
    const result = await gql(`
      mutation Login($clientId: String!, $clientSecret: String!) {
        login(clientId: $clientId, clientSecret: $clientSecret) {
          token clientId name expiresIn
        }
      }
    `, { clientId, clientSecret })

    if (result.data?.login?.token) {
      setToken(result.data.login.token)
    }
    return result
  }

  function logout() {
    setToken(null)
  }

  return { gql, login, logout, isAuthenticated, getToken, setToken }
}
