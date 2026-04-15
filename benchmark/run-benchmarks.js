import fs from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'

import { startServer } from './server'

const BASE_URL = 'http://localhost:5050'
const QUERY_SIMPLE = `
query UsersSimple($limit: Int) {
  users(limit: $limit) {
    id
    fullName
  }
}
`

const QUERY_NESTED = `
query UsersNested($limit: Int) {
  users(limit: $limit) {
    id
    fullName
    posts {
      id
      body
      comments {
        id
        body
      }
    }
  }
}
`

async function measuredFetch(url, options = {}) {
  const start = performance.now()
  const response = await fetch(url, options)
  const text = await response.text()
  const elapsedMs = performance.now() - start
  const dbQueries = Number(response.headers.get('x-db-queries') || 0)

  let json = null
  try {
    json = JSON.parse(text)
  } catch (error) {
    json = { parseError: true }
  }

  return {
    elapsedMs,
    status: response.status,
    dbQueries,
    payloadBytes: Buffer.byteLength(text, 'utf8'),
    json
  }
}

function aggregate(label, scenario, requests) {
  return {
    scenario,
    label,
    responseTimeMs: Number(requests.reduce((sum, item) => sum + item.elapsedMs, 0).toFixed(3)),
    httpRequests: requests.length,
    dbQueries: requests.reduce((sum, item) => sum + item.dbQueries, 0),
    payloadBytes: requests.reduce((sum, item) => sum + item.payloadBytes, 0)
  }
}

async function runOverFetchingScenario() {
  const rest = await measuredFetch(`${BASE_URL}/api/users-overfetch?limit=20`)
  const graphQl = await measuredFetch(`${BASE_URL}/graphql-optimized`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: QUERY_SIMPLE,
      variables: { limit: 20 }
    })
  })

  return [
    aggregate('REST (over-fetching)', 'Over-fetching', [rest]),
    aggregate('GraphQL optimized', 'Over-fetching', [graphQl])
  ]
}

async function runUnderFetchingScenario() {
  const requests = []
  const usersRes = await measuredFetch(`${BASE_URL}/api/users-basic?limit=10`)
  requests.push(usersRes)

  const users = usersRes?.json?.items || []
  for (const user of users) {
    const postsRes = await measuredFetch(`${BASE_URL}/api/users/${user.id}/posts`)
    requests.push(postsRes)
  }

  const graphQl = await measuredFetch(`${BASE_URL}/graphql-optimized`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query UsersWithPosts($limit: Int) {
          users(limit: $limit) {
            id
            fullName
            posts {
              id
              body
            }
          }
        }
      `,
      variables: { limit: 10 }
    })
  })

  return [
    aggregate('REST (under-fetching)', 'Under-fetching', requests),
    aggregate('GraphQL optimized', 'Under-fetching', [graphQl])
  ]
}

async function runNPlusOneScenario() {
  const naive = await measuredFetch(`${BASE_URL}/graphql-naive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY_NESTED, variables: { limit: 10 } })
  })

  const dataloader = await measuredFetch(`${BASE_URL}/graphql-dataloader`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY_NESTED, variables: { limit: 10 } })
  })

  const optimized = await measuredFetch(`${BASE_URL}/graphql-optimized`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY_NESTED, variables: { limit: 10 } })
  })

  return [
    aggregate('GraphQL naive (N+1)', 'GraphQL N+1', [naive]),
    aggregate('GraphQL + DataLoader', 'GraphQL N+1', [dataloader]),
    aggregate('GraphQL optimized (Join Monster)', 'GraphQL N+1', [optimized])
  ]
}

async function runAll() {
  const server = await startServer(5050)
  try {
    const results = [
      ...(await runOverFetchingScenario()),
      ...(await runUnderFetchingScenario()),
      ...(await runNPlusOneScenario())
    ]

    const payload = {
      generatedAt: new Date().toISOString(),
      metrics: results
    }

    const targetFile = path.join(__dirname, 'results', 'latest.json')
    fs.writeFileSync(targetFile, JSON.stringify(payload, null, 2))

    console.log('Benchmark completed and written to benchmark/results/latest.json')
    console.table(results)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

runAll().catch(error => {
  console.error(error)
  process.exit(1)
})
