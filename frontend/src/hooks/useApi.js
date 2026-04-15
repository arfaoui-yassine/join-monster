const API_BASE = ''

export function useApi() {

  async function fetchRest(endpoint) {
    const start = performance.now()
    const res = await fetch(`${API_BASE}/api/rest${endpoint}`)
    const data = await res.json()
    const elapsed = performance.now() - start
    return {
      ...data,
      _meta: {
        ...data._meta,
        clientTimeMs: parseFloat(elapsed.toFixed(2))
      }
    }
  }

  async function fetchGraphQL(strategy, query, variables = {}) {
    const urlMap = {
      naive: '/api/graphql-naive',
      dataloader: '/api/graphql-dataloader',
      joinmonster: '/api/graphql-joinmonster'
    }
    const url = urlMap[strategy]
    if (!url) throw new Error(`Unknown strategy: ${strategy}`)

    const start = performance.now()
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    })
    const data = await res.json()
    const elapsed = performance.now() - start

    const queryCount = res.headers.get('X-Query-Count')
    const execTime = res.headers.get('X-Execution-Time')
    const sqlPreview = res.headers.get('X-SQL-Preview')

    return {
      ...data,
      _meta: {
        ...(data.extensions?._meta || {}),
        queryCount: queryCount ? parseInt(queryCount) : data.extensions?._meta?.queryCount,
        executionTimeMs: execTime ? parseFloat(execTime) : data.extensions?._meta?.executionTimeMs,
        clientTimeMs: parseFloat(elapsed.toFixed(2)),
        sql: sqlPreview ? atob(sqlPreview) : data.extensions?._meta?.sql || null
      }
    }
  }

  async function compare(queryKey, customQuery = null) {
    const res = await fetch(`${API_BASE}/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryKey, customQuery })
    })
    return res.json()
  }

  async function fetchQueries() {
    const res = await fetch(`${API_BASE}/api/queries`)
    return res.json()
  }

  async function restMutate(endpoint, method = 'POST', body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(`${API_BASE}/api/rest${endpoint}`, opts)
    return res.json()
  }

  return { fetchRest, fetchGraphQL, compare, fetchQueries, restMutate }
}
