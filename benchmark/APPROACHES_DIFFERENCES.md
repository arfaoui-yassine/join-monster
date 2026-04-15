# Differences Between the Four Approaches

This project compares four backend data-fetching approaches over the same relational dataset.

## 1) REST API (Express)

### How it works
- Client calls fixed endpoints (for example: `/api/users-basic`, `/api/users/:id/posts`).
- Each endpoint returns a predefined shape.

### Strengths
- Simple and predictable for straightforward use cases.
- Easy caching and debugging per endpoint.
- Good performance for simple, stable read patterns.

### Weaknesses
- Over-fetching risk: endpoint may return more fields than needed.
- Under-fetching risk: client may need multiple calls for related data.
- API surface grows quickly as UI needs diversify.

### In this benchmark
- Over-fetching scenario: REST returns extra user fields not always required.
- Under-fetching scenario: REST requires multiple HTTP calls to gather related resources.

---

## 2) GraphQL Naive (without optimization)

### How it works
- Client requests exactly the fields it needs using GraphQL.
- Resolvers fetch nested relations independently.

### Strengths
- Flexible response shape per request.
- Eliminates client-side over-fetching.
- Great developer experience for complex UI data needs.

### Weaknesses
- N+1 query problem is common with nested relations.
- DB query count can grow rapidly with deeper graphs.
- Server-side performance can degrade without batching/planning.

### In this benchmark
- Nested query (`users -> posts -> comments`) triggers many DB queries.
- This approach is used to demonstrate the N+1 performance pitfall.

---

## 3) GraphQL Optimized (Join Monster)

### How it works
- GraphQL schema includes metadata for SQL planning.
- Join Monster compiles the GraphQL query into efficient SQL joins/batches.

### Strengths
- Keeps GraphQL flexibility while reducing DB round trips.
- Avoids most N+1 behavior for supported relationship patterns.
- Better scaling for complex nested reads.

### Weaknesses
- More setup and schema annotation complexity.
- Requires understanding SQL modeling and Join Monster conventions.
- Less trivial than basic resolvers for small/simple projects.

### In this benchmark
- Same nested query is resolved with drastically fewer DB queries.
- Demonstrates how optimization can match or outperform REST in complex reads.

---

## 4) GraphQL Optimized (DataLoader)

### How it works
- GraphQL resolvers stay explicit and use DataLoader instances per request.
- Nested entity loading is batched by key (for example, posts by author IDs and comments by post IDs).

### Strengths
- Greatly reduces N+1 query explosions in resolver-based GraphQL.
- Preserves normal resolver patterns and incremental adoption.
- Adds optional per-request caching automatically.

### Weaknesses
- Still resolver-driven, so deeper graphs can require more manual loader design.
- Can lead to many loaders and custom grouping logic as schema grows.
- Typically issues more DB queries than SQL-planning approaches for very nested reads.

### In this benchmark
- The nested query (`users -> posts -> comments`) is batched into fewer queries than naive GraphQL.
- Shows a middle-ground optimization between naive resolvers and Join Monster SQL planning.

---

## Summary Table

| Dimension | REST | GraphQL Naive | GraphQL + DataLoader | GraphQL + Join Monster |
|---|---|---|---|---|
| Response shape flexibility | Low (fixed endpoints) | High | High | High |
| Over-fetching risk | High | Low | Low | Low |
| Under-fetching / extra HTTP calls | Medium to High | Low | Low | Low |
| N+1 DB query risk | Low to Medium | High | Medium to Low | Low |
| Implementation complexity | Low | Medium | Medium to High | High |
| Best fit | Stable/simple endpoints | Rapid schema evolution, small scale | Resolver-first GraphQL apps needing batching | Complex nested SQL-backed APIs |

## Practical Takeaway

- Use REST when your data access patterns are simple and stable.
- Use GraphQL naive only as a starting point, then optimize when query depth grows.
- Use GraphQL + DataLoader when you want targeted N+1 mitigation while keeping resolver-centric architecture.
- Use GraphQL + Join Monster when you need GraphQL flexibility with SQL-efficient execution at scale.
