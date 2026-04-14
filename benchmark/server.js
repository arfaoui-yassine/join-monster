import path from 'path'
import express from 'express'
import { graphql } from 'graphql'
import { performance } from 'perf_hooks'

import db from './db'
import { createNaiveSchema, createOptimizedSchema } from './graphql-schemas'

const naiveSchema = createNaiveSchema()
const optimizedSchema = createOptimizedSchema()

function sendMeasuredJson(req, res, start, payload) {
  const body = JSON.stringify(payload)
  const bytes = Buffer.byteLength(body, 'utf8')
  const elapsedMs = performance.now() - start

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('X-Db-Queries', String(req.metrics.dbQueries))
  res.setHeader('X-Response-Time-Ms', elapsedMs.toFixed(3))
  res.setHeader('X-Payload-Bytes', String(bytes))
  res.status(200).send(body)
}

function applyRequestMetrics(req, res, next) {
  req.metrics = { dbQueries: 0 }
  req.trackDbQuery = () => {
    req.metrics.dbQueries += 1
  }
  next()
}

async function runGraphql(schema, req, res) {
  const start = performance.now()
  const body = req.body || {}
  const contextValue = {
    db,
    trackDbQuery: req.trackDbQuery
  }

  const result = await graphql({
    schema,
    source: body.query || '',
    variableValues: body.variables || {},
    operationName: body.operationName,
    contextValue
  })

  sendMeasuredJson(req, res, start, result)
}

export function createApp() {
  const app = express()

  app.use(express.json({ limit: '2mb' }))
  app.use(applyRequestMetrics)

  app.use('/benchmark', express.static(path.join(__dirname, 'public')))

  app.get('/benchmark/results/latest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'results', 'latest.json'))
  })

  app.get('/api/users-overfetch', async (req, res, next) => {
    const start = performance.now()
    try {
      const limit = Number(req.query.limit || 15)
      req.trackDbQuery()
      const users = await db('accounts')
        .select('id', 'first_name', 'last_name', 'email_address', 'num_legs')
        .orderBy('id', 'asc')
        .limit(limit)

      const payload = {
        scenario: 'over-fetching',
        items: users.map(user => ({
          id: user.id,
          fullName: `${user.first_name} ${user.last_name}`,
          email: user.email_address,
          numLegs: user.num_legs
        }))
      }
      sendMeasuredJson(req, res, start, payload)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/users-basic', async (req, res, next) => {
    const start = performance.now()
    try {
      const limit = Number(req.query.limit || 10)
      req.trackDbQuery()
      const users = await db('accounts')
        .select('id', 'first_name', 'last_name')
        .orderBy('id', 'asc')
        .limit(limit)

      const payload = {
        items: users.map(user => ({
          id: user.id,
          fullName: `${user.first_name} ${user.last_name}`
        }))
      }
      sendMeasuredJson(req, res, start, payload)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/users/:id/posts', async (req, res, next) => {
    const start = performance.now()
    try {
      req.trackDbQuery()
      const posts = await db('posts')
        .select('id', 'author_id', 'body')
        .where({ author_id: Number(req.params.id) })
        .orderBy('id', 'asc')

      sendMeasuredJson(req, res, start, {
        items: posts
      })
    } catch (error) {
      next(error)
    }
  })

  app.post('/graphql-naive', async (req, res, next) => {
    try {
      await runGraphql(naiveSchema, req, res)
    } catch (error) {
      next(error)
    }
  })

  app.post('/graphql-optimized', async (req, res, next) => {
    try {
      await runGraphql(optimizedSchema, req, res)
    } catch (error) {
      next(error)
    }
  })

  app.use((error, req, res, next) => {
    const payload = {
      error: error.message
    }
    if (res.headersSent) {
      next(error)
      return
    }
    res.status(500).json(payload)
  })

  return app
}

export async function startServer(port = 5050) {
  const app = createApp()
  return new Promise(resolve => {
    const server = app.listen(port, () => resolve(server))
  })
}

if (require.main === module) {
  startServer().then(() => {
    console.log('Benchmark server listening on http://localhost:5050/benchmark')
  })
}
