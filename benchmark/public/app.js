async function loadData() {
  const res = await fetch('/benchmark/results/latest.json')
  if (!res.ok) {
    throw new Error('Run npm run benchmark:run first to generate results.')
  }
  return res.json()
}

const MAX_VISIBLE_METRICS = 12
const SCENARIO_ORDER = ['Over-fetching', 'Under-fetching', 'GraphQL N+1']
let chartInstances = []

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

;(async () => {
  try {
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
