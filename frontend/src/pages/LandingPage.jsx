import { Link } from 'react-router-dom'

const steps = [
  {
    num: 1,
    cls: 'rest',
    title: 'REST API',
    desc: 'Traditional REST endpoints with multiple round-trips. Each resource requires separate HTTP calls, leading to over-fetching and under-fetching.',
    tag: 'N+1 Problem',
    queries: '~50+ queries',
    icon: '🔗'
  },
  {
    num: 2,
    cls: 'naive',
    title: 'Naive GraphQL',
    desc: 'GraphQL schema with individual resolvers. Clients get exactly the data they ask for, but resolvers still fire N+1 SQL queries.',
    tag: 'Still N+1',
    queries: '~30+ queries',
    icon: '📡'
  },
  {
    num: 3,
    cls: 'dataloader',
    title: 'GraphQL + DataLoader',
    desc: 'Facebook\'s DataLoader batches and caches database lookups within a single request, collapsing N queries into batched WHERE IN clauses.',
    tag: 'Batched',
    queries: '~5-8 queries',
    icon: '⚡'
  },
  {
    num: 4,
    cls: 'joinmonster',
    title: 'GraphQL + Join Monster',
    desc: 'Translates the entire GraphQL query into optimized SQL JOINs. One round-trip to the database retrieves all nested data at once.',
    tag: '1-2 queries',
    queries: '1-2 queries',
    icon: '🚀'
  }
]

const stats = [
  { label: 'Strategies Compared', value: '4', color: 'cyan' },
  { label: 'Data Entities', value: '5', color: 'purple' },
  { label: 'Demo Queries', value: '5', color: 'green' },
  { label: 'Live SQL Inspection', value: '✓', color: 'orange' }
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🎓 GraphQL Class Project — Live Demo</div>
        <h1>
          The <span className="gradient-text">GraphQL Migration</span>
          <br />Journey
        </h1>
        <p className="hero-description">
          Experience the evolution from REST to optimized GraphQL. Compare performance, 
          inspect SQL queries, and understand why each optimization matters — all in real-time.
        </p>
        <div className="hero-actions">
          <Link to="/compare" className="btn btn-primary btn-lg">📊 Compare Strategies</Link>
          <Link to="/journey" className="btn btn-secondary btn-lg">🎓 Learn the Journey</Link>
        </div>
      </section>

      {/* Stats */}
      <div className="page-container">
        <div className="grid-4" style={{ marginTop: '-2rem', position: 'relative', zIndex: 10 }}>
          {stats.map((s, i) => (
            <div key={i} className={`metric-card animate-in stagger-${i + 1}`}>
              <div className="metric-card-label">{s.label}</div>
              <div className={`metric-card-value ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            The Migration Path
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Click on any stage to see how it works in the interactive comparison dashboard.
          </p>
          <div className="timeline">
            {steps.map((step, i) => (
              <Link to="/compare" key={i} style={{ textDecoration: 'none' }}>
                <div className={`timeline-step ${step.cls} animate-in stagger-${i + 1}`}>
                  <div className="timeline-step-number">{step.icon}</div>
                  <div className="timeline-step-title">{step.title}</div>
                  <div className="timeline-step-desc">{step.desc}</div>
                  <span className="timeline-step-tag">{step.tag}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            Explore the Platform
          </h2>
          <div className="grid-3">
            <Link to="/compare" style={{ textDecoration: 'none' }}>
              <div className="glass-card glass-card-inner" style={{ height: '100%' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Comparison Dashboard</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Run the same query across all 4 strategies and compare query counts, 
                  execution times, and generated SQL side-by-side.
                </p>
              </div>
            </Link>
            <Link to="/explorer" style={{ textDecoration: 'none' }}>
              <div className="glass-card glass-card-inner" style={{ height: '100%' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🗃️</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Data Explorer & CRUD</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Browse Users, Posts, and Comments. Create, update, and delete records.
                  See the real database behind the demo.
                </p>
              </div>
            </Link>
            <Link to="/playground" style={{ textDecoration: 'none' }}>
              <div className="glass-card glass-card-inner" style={{ height: '100%' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🧪</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Query Playground</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Write custom GraphQL queries, pick a strategy, and see the raw SQL 
                  that gets generated and the full response.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
