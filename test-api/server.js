
import http from 'http'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/use/ws'

import { createHandler } from 'graphql-http/lib/use/express'
import { graphql } from 'graphql'

import schemaBasic from './schema-basic/index'
import schemaRelay from './schema-paginated/index'
import { carRentalSchema } from './car-rental/schema'
import { authMiddleware } from './car-rental/auth'
import { resolveNaive, resolveDataLoader, resolveJoinMonster, runAllBenchmarks } from './car-rental/benchmark'

const app = express()

app.use(cors())
app.use(express.json())

// ============ CAR RENTAL GRAPHQL API ============

// Auth middleware for car rental
app.use('/car-rental', authMiddleware)

// GraphiQL interface for car rental
app.get('/car-rental', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Car Rental GraphQL API</title>
      <style>
        body { height: 100vh; margin: 0; overflow: hidden; }
        #graphiql { height: 100vh; }
      </style>
      <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
      <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
      <script crossorigin src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
    </head>
    <body>
      <div id="graphiql"></div>
      <script>
        const fetcher = GraphiQL.createFetcher({
          url: '/car-rental/graphql',
          headers: { 'Content-Type': 'application/json' },
          wsUrl: 'ws://localhost:3000/car-rental/subscriptions'
        });
        ReactDOM.render(
          React.createElement(GraphiQL, {
            fetcher,
            defaultQuery: \`# Car Rental GraphQL API
# Try these queries:

# 1. Get dashboard stats
query Stats {
  stats {
    totalCars
    availableCars
    totalCustomers
    activeReservations
    totalRevenue
    averageRating
  }
}

# 2. Browse cars with filters  
# query Cars {
#   cars(limit: 5, filter: { category_id: 4, available: true }) {
#     id brand model year
#     price_per_day color
#     category { name }
#     agency { name city }
#     averageRating
#   }
# }

# 3. Login (get JWT token for mutations)
# mutation Login {
#   login(clientId: "carrental-app", clientSecret: "cr-secret-2024") {
#     token
#     expiresIn
#   }
# }
\`
          }),
          document.getElementById('graphiql')
        );
      </script>
    </body>
    </html>
  `)
})

// Car rental GraphQL HTTP endpoint
app.post('/car-rental/graphql', async (req, res) => {
  try {
    const { query, variables, operationName } = req.body
    const result = await graphql({
      schema: carRentalSchema,
      source: query,
      variableValues: variables,
      operationName,
      contextValue: { auth: req.auth }
    })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ errors: [{ message: err.message }] })
  }
})
// Performance Benchmark endpoint
app.get('/car-rental/benchmark', async (req, res) => {
  try {
    console.log('🏁 Running performance benchmark...')
    const naive = await resolveNaive()
    const dataloader = await resolveDataLoader()
    const joinmonster = await resolveJoinMonster()
    console.log(`✅ Benchmark done: Naive=${naive.duration.toFixed(0)}ms, DL=${dataloader.duration.toFixed(0)}ms, JM=${joinmonster.duration.toFixed(0)}ms`)
    res.json({ naive, dataloader, joinmonster, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('Benchmark error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Multi-scenario benchmark endpoint
app.get('/car-rental/benchmark/all', async (req, res) => {
  try {
    console.log('🏁 Running multi-scenario benchmark...')
    const scenarios = await runAllBenchmarks()
    scenarios.forEach(s => {
      console.log(`  ${s.icon} ${s.name}: N=${s.naive.duration.toFixed(0)}ms DL=${s.dataloader.duration.toFixed(0)}ms JM=${s.joinmonster.duration.toFixed(0)}ms`)
    })
    console.log('✅ All benchmarks complete')
    res.json({ scenarios, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('Benchmark error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============ EXISTING GRAPHQL ENDPOINTS ============

app.get('/graphql', (req, res) => {
  res.sendFile(path.join(__dirname, 'graphsiql', 'index.html'))
})

app.get('/graphql-relay', (req, res) => {
  res.sendFile(path.join(__dirname, 'graphsiql', 'index.html'))
})

app.post(
  '/graphql',
  createHandler({
    schema: schemaBasic,
    context: req => req.raw,
    formatError: e => {
      console.error(e)
      return e
    }
  }))

app.post(
  '/graphql-relay',
  createHandler({
    schema: schemaRelay,
    context: req => req.raw,
    formatError: e => {
      console.error(e)
      return e
    }
  })
)

// ============ SERVE FRONTEND ============

app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')))

// SPA fallback — serve index.html for all unmatched routes
app.get('*', (req, res) => {
  // Don't serve index.html for API/graphql routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/graphql')) {
    return res.status(404).json({ error: 'Not found' })
  }
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'))
})

// ============ HTTP + WEBSOCKET SERVER ============

const server = http.createServer(app)

// WebSocket server for GraphQL subscriptions
const wsServer = new WebSocketServer({
  server,
  path: '/car-rental/subscriptions'
})

useServer(
  {
    schema: carRentalSchema,
    context: (ctx) => {
      // Extract auth from connection params if provided
      return { auth: ctx.connectionParams?.auth || null }
    }
  },
  wsServer
)

const PORT = process.env.PORT || 3000

server.listen(PORT, () =>
  console.log(`
╔══════════════════════════════════════════════════════╗
║         🚗 Car Rental GraphQL API Server            ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  GraphQL API:    http://localhost:${PORT}/car-rental/graphql ║
║  GraphiQL:       http://localhost:${PORT}/car-rental        ║
║  Subscriptions:  ws://localhost:${PORT}/car-rental/subscriptions ║
║                                                      ║
║  Frontend:       http://localhost:${PORT}/               ║
║  Frontend Dev:   http://localhost:5173/               ║
║                                                      ║
║  Join Monster:   http://localhost:${PORT}/graphql         ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `)
)
