import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'car-rental-graphql-2024-secret-key'
const JWT_EXPIRES = '24h'

// Hard-coded client credentials (Option 1 from project requirements)
const CLIENTS = [
  { clientId: 'carrental-app', clientSecret: 'cr-secret-2024', name: 'Car Rental App' },
  { clientId: 'admin-dashboard', clientSecret: 'admin-2024', name: 'Admin Dashboard' }
]

export function authenticateClient(clientId, clientSecret) {
  const client = CLIENTS.find(c => c.clientId === clientId && c.clientSecret === clientSecret)
  if (!client) return null

  const token = jwt.sign(
    { clientId: client.clientId, name: client.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )

  return { token, clientId: client.clientId, name: client.name, expiresIn: JWT_EXPIRES }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const decoded = verifyToken(token)
    req.auth = decoded
  } else {
    req.auth = null
  }
  next()
}

export function requireAuth(context) {
  if (!context.auth) {
    throw new Error('Authentication required. Please login first with your client credentials.')
  }
  return context.auth
}
