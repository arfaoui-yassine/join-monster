# REST vs GraphQL Performance Benchmark

This module benchmarks equivalent data retrieval patterns with:

- REST (Express)
- GraphQL naive resolvers (N+1 behavior)
- GraphQL optimized with Join Monster

The benchmark collects:

- Response time in milliseconds
- Number of HTTP requests
- Number of DB queries
- Response payload size in bytes

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Run the benchmark runner:

```bash
npm run benchmark:run
```

3. Launch the dashboard server:

```bash
npm run benchmark:start
```

4. Open:

- http://localhost:5050/benchmark

## Scenarios

1. Over-fetching comparison (REST vs optimized GraphQL)
2. Under-fetching comparison (multi-request REST vs single GraphQL query)
3. GraphQL N+1 comparison (naive resolvers vs Join Monster)

## Notes

- Uses the local SQLite dataset at `test-api/data/db/test1-data.sl3`.
- New results are written to `benchmark/results/latest.json`.
