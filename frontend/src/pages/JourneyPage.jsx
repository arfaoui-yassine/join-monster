import { useState } from 'react'

const JOURNEY_STEPS = [
  {
    id: 'rest',
    num: 1,
    cls: 'rest',
    title: 'REST API — The Starting Point',
    icon: '🔗',
    color: 'var(--accent-orange)',
    problem: 'Over-fetching, under-fetching, and rigid endpoints',
    explanation: `In a traditional REST architecture, each resource has its own endpoint. To build a page showing a user with their posts and comments, you need multiple HTTP requests:`,
    codeTitle: 'REST Approach',
    code: `// Frontend needs to make 3+ separate requests:
const user = await fetch('/api/users/1')

const posts = await fetch('/api/users/1/posts')

// For EACH post, fetch comments (N+1!)
for (const post of posts) {
  post.comments = await fetch(
    \`/api/posts/\${post.id}/comments\`
  )
}`,
    queries: [
      'GET /api/users/1',
      'GET /api/users/1/posts',
      'GET /api/posts/2/comments',
      'GET /api/posts/8/comments', 
      'GET /api/posts/11/comments',
      'GET /api/posts/12/comments',
      '... more requests per post'
    ],
    queryCount: '1 + N + N×M',
    verdict: 'Each resource requires its own HTTP request. With nested data, the number of requests explodes.',
    pros: ['Simple to understand', 'Well-established tooling', 'Cacheable at HTTP level'],
    cons: ['Over-fetching (get entire objects)', 'Under-fetching (multiple round-trips)', 'N+1 request problem', 'Rigid endpoint structure']
  },
  {
    id: 'naive-graphql',
    num: 2,
    cls: 'naive',
    title: 'Naive GraphQL — Single Endpoint, But...',
    icon: '📡',
    color: 'var(--accent-red)',
    problem: 'N+1 SQL queries behind the scenes',
    explanation: `GraphQL solves the client-side over/under-fetching problem — the client specifies exactly what data it needs in one request. However, a naive GraphQL implementation still generates N+1 SQL queries on the server:`,
    codeTitle: 'Naive GraphQL Resolvers',
    code: `// Each resolver fires its own SQL query
const UserType = {
  posts: {
    resolve: (user) => {
      // Called once PER user! 
      return db.query(
        \`SELECT * FROM posts 
         WHERE author_id = \${user.id}\`
      )
    }
  },
  comments: {
    resolve: (user) => {
      // Called once PER user!
      return db.query(
        \`SELECT * FROM comments 
         WHERE author_id = \${user.id}\`
      )
    }
  }
}`,
    queries: [
      'SELECT * FROM accounts',
      'SELECT * FROM posts WHERE author_id = 1',
      'SELECT * FROM posts WHERE author_id = 2',
      'SELECT * FROM posts WHERE author_id = 3',
      'SELECT * FROM comments WHERE post_id = 1',
      'SELECT * FROM comments WHERE post_id = 2',
      '... one query per nested field'
    ],
    queryCount: '1 + N + N×M',
    verdict: 'Client gets exactly the data it needs, but the server still makes excessive DB queries.',
    pros: ['Exact data fetching', 'Single HTTP endpoint', 'Strong typing & introspection', 'Client-driven queries'],
    cons: ['N+1 SQL queries on server', 'Each resolver fetches independently', 'Database gets overwhelmed', 'Higher server-side latency']
  },
  {
    id: 'dataloader',
    num: 3,
    cls: 'dataloader',
    title: 'GraphQL + DataLoader — Batching',
    icon: '⚡',
    color: 'var(--accent-blue)',
    problem: 'Better, but still multiple round-trips',
    explanation: `Facebook's DataLoader batches and deduplicates database requests within a single tick. Instead of N individual queries, it groups them into IN (...) clauses:`,
    codeTitle: 'DataLoader Approach',
    code: `import DataLoader from 'dataloader'

// Create a batch loader for users
const userLoader = new DataLoader(async (ids) => {
  // ONE query for ALL requested users!
  const rows = await db.query(
    \`SELECT * FROM accounts 
     WHERE id IN (\${ids.join(',')})\`
  )
  return ids.map(id => 
    rows.find(r => r.id === id)
  )
})

// In the resolver, just call .load()
const PostType = {
  author: {
    resolve: (post) => {
      // DataLoader batches all .load() calls
      return userLoader.load(post.author_id)
    }
  }
}`,
    queries: [
      'SELECT * FROM accounts',
      'SELECT * FROM posts WHERE author_id IN (1,2,3,4,5)',
      'SELECT * FROM comments WHERE post_id IN (1,2,3,...,50)',
      'SELECT * FROM accounts WHERE id IN (1,2,3,4,5)'
    ],
    queryCount: '~5-8 queries',
    verdict: 'Significant improvement! N queries become ~1 batched query per entity type.',
    pros: ['Batches N queries into 1', 'Deduplicates identical requests', 'Per-request caching', 'Easy to add to existing code'],
    cons: ['Still multiple DB round-trips', 'Must create loaders for each relation', 'No query planning/optimization', 'Can\'t optimize JOINs']
  },
  {
    id: 'joinmonster',
    num: 4,
    cls: 'joinmonster',
    title: 'GraphQL + Join Monster — Query Planning',
    icon: '🚀',
    color: 'var(--accent-green)',
    problem: 'The optimal solution',
    explanation: `Join Monster analyzes the entire GraphQL query AST and generates a single, optimized SQL query with JOINs. One round-trip to the database, one hydrated result:`,
    codeTitle: 'Join Monster Approach',
    code: `import joinMonster from 'join-monster'

const User = new GraphQLObjectType({
  name: 'User',
  extensions: {
    joinMonster: {
      sqlTable: 'accounts',
      uniqueKey: 'id'
    }
  },
  fields: () => ({
    posts: {
      type: new GraphQLList(Post),
      extensions: {
        joinMonster: {
          // Just declare the JOIN relationship!
          sqlJoin: (userTable, postTable) =>
            \`\${postTable}.author_id = \${userTable}.id\`
        }
      }
    }
  })
})

// In the resolver — joinMonster generates the SQL
resolve: (parent, args, ctx, info) => {
  return joinMonster(info, ctx, sql => {
    return db.raw(sql) // ONE query!
  })
}`,
    queries: [
      `SELECT "user"."id", "user"."email_address", "posts"."id" AS "posts__id", "posts"."body" AS "posts__body", "comments"."id" AS "comments__id", "comments"."body" AS "comments__body", "author"."first_name" AS "author__first_name" FROM accounts AS "user" LEFT JOIN posts ON "user".id = "posts".author_id LEFT JOIN comments ON "posts".id = "comments".post_id LEFT JOIN accounts AS "author" ON "comments".author_id = "author".id WHERE "user".id = 1`
    ],
    queryCount: '1-2 queries',
    verdict: 'One SQL query with JOINs retrieves everything. Maximum efficiency!',
    pros: ['1-2 SQL queries total', 'Automatic JOIN generation', 'Declarative schema mapping', 'Optimal query planning', 'No over-fetching at DB level'],
    cons: ['Learning curve', 'Specific to SQL databases', 'Complex for very large schemas']
  }
]

function N1Visualization({ queries, cls }) {
  const [visibleCount, setVisibleCount] = useState(0)

  const handleAnimate = () => {
    setVisibleCount(0)
    queries.forEach((_, i) => {
      setTimeout(() => setVisibleCount(i + 1), (i + 1) * 150)
    })
  }

  return (
    <div className="glass-card" style={{ marginTop: '1rem' }}>
      <div className="glass-card-inner">
        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            SQL QUERIES EXECUTED
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleAnimate}>
            ▶ Animate
          </button>
        </div>
        <div className="n1-visualization">
          {queries.map((q, i) => (
            <div 
              key={i}
              className={`n1-query-line ${cls === 'joinmonster' ? 'joined' : cls === 'dataloader' ? 'batched' : ''}`}
              style={{ 
                opacity: visibleCount === 0 ? 1 : i < visibleCount ? 1 : 0.15,
                animationDelay: `${i * 0.1}s`
              }}
            >
              <span className="query-num">Q{i + 1}</span>
              <code style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {q}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function JourneyPage() {
  const [activeStep, setActiveStep] = useState(0)
  const step = JOURNEY_STEPS[activeStep]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🎓 The Migration Journey</h1>
        <p className="page-subtitle">
          Follow the step-by-step evolution from REST to optimized GraphQL. Click each phase to explore.
        </p>
      </div>

      {/* Step Navigator */}
      <div className="timeline" style={{ marginBottom: '2rem' }}>
        {JOURNEY_STEPS.map((s, i) => (
          <div 
            key={i}
            className={`timeline-step ${s.cls} ${activeStep === i ? '' : ''}`}
            onClick={() => setActiveStep(i)}
            style={{
              cursor: 'pointer',
              border: activeStep === i ? `2px solid ${s.color}` : undefined,
              transform: activeStep === i ? 'translateY(-4px)' : undefined,
              boxShadow: activeStep === i ? `0 10px 40px ${s.color}22` : undefined
            }}
          >
            <div className="timeline-step-number">{s.icon}</div>
            <div className="timeline-step-title">{s.title.split('—')[0]}</div>
            <div className="timeline-step-tag">{s.queryCount}</div>
          </div>
        ))}
      </div>

      {/* Step Detail */}
      <div className="journey-section" key={step.id}>
        <div className="glass-card glass-card-inner" style={{ borderTop: `3px solid ${step.color}` }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="flex-gap" style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{step.icon}</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{step.title}</h2>
            </div>
            <div className={`badge badge-${step.cls === 'rest' ? 'orange' : step.cls === 'naive' ? 'red' : step.cls === 'dataloader' ? 'blue' : 'green'}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
              {step.problem}
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
            {step.explanation}
          </p>

          {/* Code */}
          <div className="code-viewer" style={{ marginBottom: '1.5rem' }}>
            <div className="code-viewer-header">
              <span className="code-viewer-title">{step.codeTitle}</span>
              <span className={`badge badge-${step.cls === 'rest' ? 'orange' : step.cls === 'naive' ? 'red' : step.cls === 'dataloader' ? 'blue' : 'green'}`}>
                {step.queryCount}
              </span>
            </div>
            <div className="code-viewer-body">
              <pre>{step.code}</pre>
            </div>
          </div>

          {/* N+1 Visualization */}
          <N1Visualization queries={step.queries} cls={step.cls} />

          {/* Verdict */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem 1.25rem', 
            borderRadius: 'var(--radius-md)',
            background: `${step.color}10`,
            borderLeft: `4px solid ${step.color}`
          }}>
            <p style={{ fontWeight: 600, color: step.color, fontSize: '0.85rem' }}>💡 Key Takeaway</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>{step.verdict}</p>
          </div>

          {/* Pros & Cons */}
          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '0.75rem' }}>
                ✅ Advantages
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {step.pros.map((p, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--accent-green)' }}>•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-red)', marginBottom: '0.75rem' }}>
                ❌ Limitations
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {step.cons.map((c, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--accent-red)' }}>•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-between" style={{ marginTop: '1rem' }}>
        <button 
          className="btn btn-secondary"
          disabled={activeStep === 0}
          onClick={() => setActiveStep(prev => prev - 1)}
        >
          ← Previous
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Step {activeStep + 1} of {JOURNEY_STEPS.length}
        </span>
        <button 
          className="btn btn-primary"
          disabled={activeStep === JOURNEY_STEPS.length - 1}
          onClick={() => setActiveStep(prev => prev + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
