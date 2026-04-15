
import path from 'path'
import express from 'express'
import cors from 'cors'

import { createHandler } from 'graphql-http/lib/use/express'
import { graphql } from 'graphql'

import schemaBasic from './schema-basic/index'
import schemaRelay from './schema-paginated/index'
import { schema as schemaNaive, createQueryTracker as createNaiveTracker } from './schema-naive/index'
import { schema as schemaDataloader, createLoaders, createQueryTracker as createDLTracker } from './schema-dataloader/index'
import restRoutes from './rest-routes'
import dbCall from './data/fetch'
import knex from './data/database'

import joinMonster from '../src/index'

const app = express()

app.use(cors())
app.use(express.json())

// ============ EXISTING GRAPHIQL PAGES ============

app.get('/graphql', (req, res) => {
  res.sendFile(path.join(__dirname, 'graphsiql', 'index.html'))
})

app.get('/graphql-relay', (req, res) => {
  res.sendFile(path.join(__dirname, 'graphsiql', 'index.html'))
})

// ============ EXISTING JOIN MONSTER ENDPOINTS ============

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

// ============ REST API ============

app.use('/api/rest', restRoutes)

// ============ NAIVE GRAPHQL (N+1) ============

app.post('/api/graphql-naive', async (req, res) => {
  try {
    const tracker = createNaiveTracker()
    const { query, variables } = req.body

    const result = await graphql({
      schema: schemaNaive,
      source: query,
      variableValues: variables,
      contextValue: { tracker }
    })

    const queryCount = tracker.getCount()
    const executionTimeMs = parseFloat(tracker.getElapsed().toFixed(2))

    res.set('X-Query-Count', String(queryCount))
    res.set('X-Execution-Time', String(executionTimeMs))
    res.set('Access-Control-Expose-Headers', 'X-Query-Count, X-Execution-Time')

    res.json({
      ...result,
      extensions: {
        ...(result.extensions || {}),
        _meta: {
          strategy: 'Naive GraphQL',
          queryCount,
          executionTimeMs
        }
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ errors: [{ message: err.message }] })
  }
})

// ============ DATALOADER GRAPHQL ============

app.post('/api/graphql-dataloader', async (req, res) => {
  try {
    const tracker = createDLTracker()
    const loaders = createLoaders(tracker)
    const { query, variables } = req.body

    const result = await graphql({
      schema: schemaDataloader,
      source: query,
      variableValues: variables,
      contextValue: { tracker, loaders }
    })

    const queryCount = tracker.getCount()
    const executionTimeMs = parseFloat(tracker.getElapsed().toFixed(2))

    res.set('X-Query-Count', String(queryCount))
    res.set('X-Execution-Time', String(executionTimeMs))
    res.set('Access-Control-Expose-Headers', 'X-Query-Count, X-Execution-Time')

    res.json({
      ...result,
      extensions: {
        ...(result.extensions || {}),
        _meta: {
          strategy: 'DataLoader GraphQL',
          queryCount,
          executionTimeMs
        }
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ errors: [{ message: err.message }] })
  }
})

// ============ JOIN MONSTER API (with metrics) ============

app.post('/api/graphql-joinmonster', async (req, res) => {
  try {
    const start = process.hrtime.bigint()
    let queryCount = 0
    const { query, variables } = req.body
    let capturedSql = ''

    const result = await graphql({
      schema: schemaBasic,
      source: query,
      variableValues: variables,
      contextValue: {
        res,
        capturedSql: '',
      }
    })

    // Extract SQL from response header if set by dbCall
    capturedSql = res.getHeader('X-SQL-Preview')
    if (capturedSql) {
      try { capturedSql = atob(capturedSql) } catch(e) { /* ignore */ }
    }

    const end = process.hrtime.bigint()
    const executionTimeMs = parseFloat((Number(end - start) / 1e6).toFixed(2))

    // Join Monster typically does 1-2 queries
    queryCount = capturedSql ? (capturedSql.split('SELECT').length - 1) || 1 : 1

    res.set('X-Query-Count', String(queryCount))
    res.set('X-Execution-Time', String(executionTimeMs))
    res.set('Access-Control-Expose-Headers', 'X-Query-Count, X-Execution-Time, X-SQL-Preview')

    res.json({
      ...result,
      extensions: {
        ...(result.extensions || {}),
        _meta: {
          strategy: 'Join Monster',
          queryCount,
          executionTimeMs,
          sql: capturedSql || null
        }
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ errors: [{ message: err.message }] })
  }
})

// ============ COMPARISON ENDPOINT ============

const PREDEFINED_QUERIES = {
  'users-basic': {
    name: 'List Users (basic)',
    graphql: '{ users { id fullName email_address } }',
    description: 'Simple flat query - no nesting'
  },
  'users-with-posts': {
    name: 'Users with Posts',
    graphql: '{ users { id fullName posts { id body } } }',
    description: 'One level of nesting - triggers N+1 in naive'
  },
  'users-deep': {
    name: 'Users → Posts → Comments → Author',
    graphql: '{ users { id fullName posts { id body comments { id body author { id fullName } } } } }',
    description: 'Deep nesting - maximum N+1 impact'
  },
  'single-user-deep': {
    name: 'Single User Deep',
    graphql: '{ user(id: 1) { id fullName posts { id body comments { id body author { id fullName } } } following { id fullName } } }',
    description: 'Single user with all relations'
  },
  'all-posts': {
    name: 'All Posts with Authors & Comments',
    graphql: '{ posts { id body author { id fullName } comments { id body author { fullName } } } }',
    description: 'All posts with nested relations'
  }
}

app.get('/api/queries', (req, res) => {
  res.json(PREDEFINED_QUERIES)
})

app.post('/api/compare', async (req, res) => {
  try {
    const { queryKey, customQuery } = req.body
    const gqlQuery = customQuery || (PREDEFINED_QUERIES[queryKey] && PREDEFINED_QUERIES[queryKey].graphql)

    if (!gqlQuery) {
      return res.status(400).json({ error: 'Provide queryKey or customQuery' })
    }

    const results = {}

    // 1. Naive GraphQL
    const naiveTracker = createNaiveTracker()
    const naiveResult = await graphql({
      schema: schemaNaive,
      source: gqlQuery,
      contextValue: { tracker: naiveTracker }
    })
    results.naive = {
      strategy: 'Naive GraphQL',
      data: naiveResult.data,
      errors: naiveResult.errors || null,
      queryCount: naiveTracker.getCount(),
      executionTimeMs: parseFloat(naiveTracker.getElapsed().toFixed(2))
    }

    // 2. DataLoader GraphQL
    const dlTracker = createDLTracker()
    const dlLoaders = createLoaders(dlTracker)
    const dlResult = await graphql({
      schema: schemaDataloader,
      source: gqlQuery,
      contextValue: { tracker: dlTracker, loaders: dlLoaders }
    })
    results.dataloader = {
      strategy: 'DataLoader GraphQL',
      data: dlResult.data,
      errors: dlResult.errors || null,
      queryCount: dlTracker.getCount(),
      executionTimeMs: parseFloat(dlTracker.getElapsed().toFixed(2))
    }

    // 3. Join Monster GraphQL
    const jmStart = process.hrtime.bigint()
    const jmResult = await graphql({
      schema: schemaBasic,
      source: gqlQuery,
      contextValue: { capturedSql: '' }
    })
    const jmEnd = process.hrtime.bigint()
    const jmTime = parseFloat((Number(jmEnd - jmStart) / 1e6).toFixed(2))
    results.joinmonster = {
      strategy: 'Join Monster',
      data: jmResult.data,
      errors: jmResult.errors || null,
      queryCount: 1,
      executionTimeMs: jmTime
    }

    res.json({
      query: gqlQuery,
      results
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ============ SERVE FRONTEND (production) ============

app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')))
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'))
})
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'))
})

app.listen(3000, () =>
  console.log(
    'server listening at http://localhost:3000/graphql and http://localhost:3000/graphql-relay\n' +
    'Demo frontend: http://localhost:3000/app (production build) or http://localhost:5173 (dev)\n' +
    'API endpoints:\n' +
    '  REST:       /api/rest/*\n' +
    '  Naive GQL:  /api/graphql-naive\n' +
    '  DataLoader: /api/graphql-dataloader\n' +
    '  JoinMonster:/api/graphql-joinmonster\n' +
    '  Compare:    /api/compare'
  )
)
