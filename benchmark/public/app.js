async function loadData() {
  const res = await fetch('/benchmark/results/latest.json')
  if (!res.ok) {
    throw new Error('Run npm run benchmark:run first to generate results.')
  }
  return res.json()
}

const MAX_VISIBLE_METRICS = 12
const SCENARIO_ORDER = ['Over-fetching', 'Under-fetching', 'GraphQL N+1']
const APPROACH_ORDER = [
  'REST (over-fetching)',
  'REST (under-fetching)',
  'GraphQL naive (N+1)',
  'GraphQL + DataLoader',
  'GraphQL optimized (Join Monster)',
  'GraphQL optimized'
]
const CRUD_APPS = [
  {
    key: 'rest',
    label: 'REST',
    description: 'Classic endpoints backed by the demo CRUD table.',
    endpoint: '/crud/rest/users',
    kind: 'rest'
  },
  {
    key: 'naive',
    label: 'GraphQL Naive',
    description: 'Resolver-first CRUD operations without batching.',
    endpoint: '/graphql-crud-naive',
    kind: 'graphql'
  },
  {
    key: 'dataloader',
    label: 'GraphQL + DataLoader',
    description: 'Resolver-first CRUD with request-scoped batching.',
    endpoint: '/graphql-crud-dataloader',
    kind: 'graphql'
  },
  {
    key: 'optimized',
    label: 'GraphQL + Join Monster',
    description: 'SQL-planned CRUD reads with GraphQL mutations.',
    endpoint: '/graphql-crud-optimized',
    kind: 'graphql'
  }
]

let chartInstances = []
const crudState = new Map()

function sanitizeMetrics(rawMetrics) {
  const metrics = Array.isArray(rawMetrics) ? rawMetrics : []
  return metrics
    .filter(item => item && item.scenario && item.label)
    .sort((a, b) => {
      const scenarioA = SCENARIO_ORDER.indexOf(a.scenario)
      const scenarioB = SCENARIO_ORDER.indexOf(b.scenario)
      if (scenarioA !== scenarioB) {
        return scenarioA - scenarioB
      }
      const approachA = APPROACH_ORDER.indexOf(a.label)
      const approachB = APPROACH_ORDER.indexOf(b.label)
      if (approachA !== -1 && approachB !== -1 && approachA !== approachB) {
        return approachA - approachB
      }
      return a.label.localeCompare(b.label)
    })
    .slice(0, MAX_VISIBLE_METRICS)
}

function buildChart(targetId, label, metrics, key, palette) {
  const labels = metrics.map(item => `${item.scenario}: ${item.label}`)
  const values = metrics.map(item => item[key])

  const ctx = document.getElementById(targetId)
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderRadius: 8,
          borderSkipped: false,
          backgroundColor: palette
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { maxRotation: 40, minRotation: 40 }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

function renderTable(metrics) {
  const body = document.getElementById('metricsBody')
  body.innerHTML = metrics
    .map(
      item => `
      <tr>
        <td><span class="badge">${item.scenario}</span></td>
        <td>${item.label}</td>
        <td>${item.responseTimeMs}</td>
        <td>${item.httpRequests}</td>
        <td>${item.dbQueries}</td>
        <td>${item.payloadBytes}</td>
      </tr>
    `
    )
    .join('')
}

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll('.tab-button'))
  const overviewView = document.getElementById('overviewView')
  const crudView = document.getElementById('crudView')

  function setView(viewName) {
    const isOverview = viewName === 'overview'
    overviewView.hidden = !isOverview
    crudView.hidden = isOverview
    buttons.forEach(button => {
      button.setAttribute('aria-selected', String(button.dataset.view === viewName))
    })
    if (!isOverview && !crudView.dataset.ready) {
      crudView.dataset.ready = 'true'
      renderCrudWorkspace()
    }
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => setView(button.dataset.view))
  })
}

function seedPayload(seedLabel) {
  const token = Math.random().toString(36).slice(2, 8)
  return {
    firstName: `${seedLabel}First${token}`,
    lastName: `${seedLabel}Last${token}`,
    emailAddress: `${seedLabel.toLowerCase()}-${token}@example.com`,
    numLegs: 2 + (token.charCodeAt(0) % 2)
  }
}

function crudListMarkup(users) {
  if (!users.length) {
    return '<li>No users returned.</li>'
  }

  return users
    .map(
      user => `<li>#${user.id} ${user.fullName || `${user.firstName} ${user.lastName}`} <span class="badge">${user.emailAddress || user.email_address}</span></li>`
    )
    .join('')
}

function crudStatusText(title, result, users) {
  return [
    `${title}`,
    `DB queries: ${result.dbQueries}`,
    `Duration: ${result.durationMs.toFixed(2)} ms`,
    `Status: ${result.status}`,
    '',
    JSON.stringify(result.payload, null, 2),
    '',
    `Current users: ${users.length}`
  ].join('\n')
}

function renderCrudCard(app) {
  const state = crudState.get(app.key) || { users: [], lastResult: null }
  const users = state.users || []
  const card = document.getElementById(`crud-card-${app.key}`)
  if (!card) {
    return
  }

  const list = card.querySelector('[data-role="crud-list"]')
  const status = card.querySelector('[data-role="crud-status"]')
  const count = card.querySelector('[data-role="crud-count"]')
  if (list) list.innerHTML = crudListMarkup(users.slice(0, 5))
  if (count) count.textContent = `${users.length} users loaded`
  if (status) {
    status.textContent = state.lastResult
      ? crudStatusText(state.lastResult.title, state.lastResult, users)
      : 'Ready.'
  }
}

function renderCrudWorkspace() {
  const grid = document.getElementById('crudGrid')
  grid.innerHTML = CRUD_APPS.map(
    app => `
      <article class="crud-card" id="crud-card-${app.key}">
        <h3>${app.label}</h3>
        <p>${app.description}</p>
        <div class="badge">${app.endpoint}</div>
        <div class="crud-actions">
          <button type="button" data-action="read" data-app="${app.key}">Read</button>
          <button type="button" data-action="create" data-app="${app.key}">Create</button>
          <button type="button" data-action="update" data-app="${app.key}">Update</button>
          <button type="button" data-action="delete" data-app="${app.key}">Delete</button>
        </div>
        <p data-role="crud-count">0 users loaded</p>
        <ul class="crud-list" data-role="crud-list"></ul>
        <pre class="crud-status" data-role="crud-status">Ready.</pre>
      </article>
    `
  ).join('')

  grid.addEventListener('click', handleCrudClick)

  CRUD_APPS.forEach(app => {
    crudState.set(app.key, { users: [], lastResult: null })
    refreshCrudUsers(app.key).catch(error => {
      setCrudStatus(app.key, 'Read failed', {
        status: 'error',
        dbQueries: 0,
        durationMs: 0,
        payload: { error: error.message }
      })
    })
  })
}

function getCrudApp(key) {
  return CRUD_APPS.find(app => app.key === key)
}

function setCrudStatus(appKey, title, result) {
  const state = crudState.get(appKey) || { users: [] }
  state.lastResult = {
    title,
    status: result.status,
    dbQueries: result.dbQueries,
    durationMs: result.durationMs,
    payload: result.payload
  }
  crudState.set(appKey, state)
  renderCrudCard(getCrudApp(appKey))
}

function updateCrudUsers(appKey, users) {
  const state = crudState.get(appKey) || { users: [] }
  state.users = users
  crudState.set(appKey, state)
  renderCrudCard(getCrudApp(appKey))
}

function graphqlCrudBody(action, payload = {}) {
  const queries = {
    read: `query Users($limit: Int) { users(limit: $limit) { id firstName lastName fullName emailAddress numLegs } }`,
    create: `mutation CreateUser($input: UserInput!) { createUser(input: $input) { id firstName lastName fullName emailAddress numLegs } }`,
    update: `mutation UpdateUser($id: Int!, $input: UserInput!) { updateUser(id: $id, input: $input) { id firstName lastName fullName emailAddress numLegs } }`,
    delete: `mutation DeleteUser($id: Int!) { deleteUser(id: $id) { id firstName lastName fullName emailAddress numLegs } }`
  }

  const variables =
    action === 'read'
      ? { limit: 5 }
      : action === 'delete'
        ? { id: payload.id }
        : action === 'update'
          ? { id: payload.id, input: payload.input }
          : { input: payload.input }

  return {
    query: queries[action],
    variables
  }
}

async function performCrudRequest(app, action, payload = {}) {
  const started = performance.now()

  if (app.kind === 'rest') {
    const options = { method: 'GET' }
    let url = app.endpoint

    if (action === 'create') {
      options.method = 'POST'
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(payload.input)
    } else if (action === 'update') {
      options.method = 'PUT'
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(payload.input)
      url = `${app.endpoint}/${payload.id}`
    } else if (action === 'delete') {
      options.method = 'DELETE'
      url = `${app.endpoint}/${payload.id}`
    } else {
      url = `${app.endpoint}?limit=5`
    }

    const response = await fetch(url, options)
    const text = await response.text()
    return {
      status: response.status,
      durationMs: performance.now() - started,
      dbQueries: Number(response.headers.get('x-db-queries') || 0),
      payload: JSON.parse(text)
    }
  }

  const response = await fetch(app.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphqlCrudBody(action, payload))
  })
  const text = await response.text()
  const json = JSON.parse(text)
  const fieldName =
    action === 'read'
      ? 'users'
      : action === 'create'
        ? 'createUser'
        : action === 'update'
          ? 'updateUser'
          : 'deleteUser'

  return {
    status: response.status,
    durationMs: performance.now() - started,
    dbQueries: Number(response.headers.get('x-db-queries') || 0),
    payload: action === 'read' ? json.data?.users || [] : json.data?.[fieldName] || null
  }
}

async function refreshCrudUsers(appKey) {
  const app = getCrudApp(appKey)
  const result = await performCrudRequest(app, 'read')
  const users = Array.isArray(result.payload) ? result.payload : result.payload?.items || []
  updateCrudUsers(appKey, users)
  setCrudStatus(appKey, 'Read users', result)
}

async function handleCrudAction(appKey, action) {
  const app = getCrudApp(appKey)
  const state = crudState.get(appKey) || { users: [] }
  const users = state.users || []

  if (action === 'read') {
    await refreshCrudUsers(appKey)
    return
  }

  let payload
  if (action === 'create') {
    payload = { input: seedPayload(app.label.replace(/\s+/g, '')) }
  } else if (action === 'update') {
    const user = users[0]
    if (!user) {
      await refreshCrudUsers(appKey)
      return
    }
    payload = {
      id: user.id,
      input: {
        firstName: `${user.firstName || user.first_name}-Updated`,
        lastName: `${user.lastName || user.last_name}-Updated`,
        emailAddress: user.emailAddress || user.email_address,
        numLegs: user.numLegs || user.num_legs || 2
      }
    }
  } else if (action === 'delete') {
    const user = users[users.length - 1]
    if (!user) {
      await refreshCrudUsers(appKey)
      return
    }
    payload = { id: user.id }
  }

  const result = await performCrudRequest(app, action, payload)
  setCrudStatus(appKey, `${action.toUpperCase()} users`, result)
  await refreshCrudUsers(appKey)
}

function handleCrudClick(event) {
  const button = event.target.closest('button[data-action][data-app]')
  if (!button) {
    return
  }
  handleCrudAction(button.dataset.app, button.dataset.action).catch(error => {
    setCrudStatus(button.dataset.app, `${button.dataset.action.toUpperCase()} failed`, {
      status: 'error',
      durationMs: 0,
      dbQueries: 0,
      payload: { error: error.message }
    })
  })
}

;(async () => {
  try {
    setupTabs()

    const data = await loadData()
    const allMetrics = Array.isArray(data.metrics) ? data.metrics : []
    const metrics = sanitizeMetrics(allMetrics)

    document.getElementById('generatedAt').textContent = `Generated at: ${new Date(data.generatedAt).toLocaleString()}`
    const limitNote = document.getElementById('limitNote')
    limitNote.textContent = `Showing ${metrics.length} of ${allMetrics.length} metric rows to keep the dashboard compact.`

    chartInstances.forEach(chart => chart.destroy())
    chartInstances = []

    chartInstances.push(buildChart('timeChart', 'Response time (ms)', metrics, 'responseTimeMs', '#ff5d2d'))
    chartInstances.push(buildChart('dbChart', 'DB queries', metrics, 'dbQueries', '#0b6e4f'))
    chartInstances.push(buildChart('payloadChart', 'Payload (bytes)', metrics, 'payloadBytes', '#0ea5e9'))
    renderTable(metrics)
  } catch (error) {
    document.getElementById('generatedAt').textContent = error.message
  }
})()
