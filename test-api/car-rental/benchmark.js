import db from './db/connection'

// ============ BENCHMARK SCENARIOS ============
// Each scenario tests a different axis of GraphQL performance

// ---------- Scenario 1: Cars with Relations (N+1 classic) ----------
// Query: Get cars with their category, agency, and review stats

async function carsNaive(limit = 100) {
  const start = performance.now()
  let qc = 0
  const cars = await db('cars').limit(limit); qc++
  for (const car of cars) {
    await db('categories').where('id', car.category_id).first(); qc++
    await db('agencies').where('id', car.agency_id).first(); qc++
    await db('reviews').where('car_id', car.id); qc++
  }
  return { duration: performance.now() - start, queryCount: qc, resultCount: cars.length }
}

async function carsDataLoader(limit = 100) {
  const start = performance.now()
  let qc = 0
  const cars = await db('cars').limit(limit); qc++
  const catIds = [...new Set(cars.map(c => c.category_id))]
  await db('categories').whereIn('id', catIds); qc++
  const agIds = [...new Set(cars.map(c => c.agency_id))]
  await db('agencies').whereIn('id', agIds); qc++
  const carIds = cars.map(c => c.id)
  await db('reviews').whereIn('car_id', carIds); qc++
  return { duration: performance.now() - start, queryCount: qc, resultCount: cars.length }
}

async function carsJoinMonster(limit = 100) {
  const start = performance.now()
  let qc = 0
  const results = await db('cars as c')
    .select('c.*', 'cat.name as cat_name', 'a.name as agency_name', 'a.city',
      db.raw('AVG(r.rating) as avg_rating'), db.raw('COUNT(r.id) as review_count'))
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .leftJoin('agencies as a', 'c.agency_id', 'a.id')
    .leftJoin('reviews as r', 'c.id', 'r.car_id')
    .groupBy('c.id').limit(limit); qc++
  return { duration: performance.now() - start, queryCount: qc, resultCount: results.length }
}

// ---------- Scenario 2: Reservations Deep Nesting ----------
// Query: Reservations -> Customer + Car -> Category + Agency (3 levels deep)

async function reservationsNaive(limit = 100) {
  const start = performance.now()
  let qc = 0
  const reservations = await db('reservations').limit(limit); qc++
  for (const r of reservations) {
    await db('customers').where('id', r.customer_id).first(); qc++
    const car = await db('cars').where('id', r.car_id).first(); qc++
    if (car) {
      await db('categories').where('id', car.category_id).first(); qc++
      await db('agencies').where('id', car.agency_id).first(); qc++
    }
  }
  return { duration: performance.now() - start, queryCount: qc, resultCount: reservations.length }
}

async function reservationsDataLoader(limit = 100) {
  const start = performance.now()
  let qc = 0
  const reservations = await db('reservations').limit(limit); qc++
  const custIds = [...new Set(reservations.map(r => r.customer_id))]
  await db('customers').whereIn('id', custIds); qc++
  const carIds = [...new Set(reservations.map(r => r.car_id))]
  const cars = await db('cars').whereIn('id', carIds); qc++
  const catIds = [...new Set(cars.map(c => c.category_id))]
  await db('categories').whereIn('id', catIds); qc++
  const agIds = [...new Set(cars.map(c => c.agency_id))]
  await db('agencies').whereIn('id', agIds); qc++
  return { duration: performance.now() - start, queryCount: qc, resultCount: reservations.length }
}

async function reservationsJoinMonster(limit = 100) {
  const start = performance.now()
  let qc = 0
  await db('reservations as r')
    .select('r.*', 'cu.first_name', 'cu.last_name', 'ca.brand', 'ca.model',
      'cat.name as category', 'ag.name as agency', 'ag.city')
    .leftJoin('customers as cu', 'r.customer_id', 'cu.id')
    .leftJoin('cars as ca', 'r.car_id', 'ca.id')
    .leftJoin('categories as cat', 'ca.category_id', 'cat.id')
    .leftJoin('agencies as ag', 'ca.agency_id', 'ag.id')
    .limit(limit); qc++
  return { duration: performance.now() - start, queryCount: qc, resultCount: limit }
}

// ---------- Scenario 3: Customer Dashboard (Aggregation Heavy) ----------
// Query: Customers with total reservations, total spent, avg review rating

async function customersNaive(limit = 50) {
  const start = performance.now()
  let qc = 0
  const customers = await db('customers').limit(limit); qc++
  for (const c of customers) {
    await db('reservations').where('customer_id', c.id).count('* as cnt').first(); qc++
    await db('reservations').where('customer_id', c.id).whereNot('status', 'cancelled').sum('total_price as total').first(); qc++
    await db('reviews').where('customer_id', c.id).avg('rating as avg').first(); qc++
  }
  return { duration: performance.now() - start, queryCount: qc, resultCount: customers.length }
}

async function customersDataLoader(limit = 50) {
  const start = performance.now()
  let qc = 0
  const customers = await db('customers').limit(limit); qc++
  const ids = customers.map(c => c.id)
  await db('reservations').whereIn('customer_id', ids).select('customer_id').count('* as cnt').groupBy('customer_id'); qc++
  await db('reservations').whereIn('customer_id', ids).whereNot('status', 'cancelled').select('customer_id').sum('total_price as total').groupBy('customer_id'); qc++
  await db('reviews').whereIn('customer_id', ids).select('customer_id').avg('rating as avg').groupBy('customer_id'); qc++
  return { duration: performance.now() - start, queryCount: qc, resultCount: customers.length }
}

async function customersJoinMonster(limit = 50) {
  const start = performance.now()
  let qc = 0
  await db('customers as c')
    .select('c.id', 'c.first_name', 'c.last_name',
      db.raw('COUNT(DISTINCT res.id) as total_reservations'),
      db.raw('COALESCE(SUM(CASE WHEN res.status != "cancelled" THEN res.total_price ELSE 0 END), 0) as total_spent'),
      db.raw('AVG(rev.rating) as avg_rating'))
    .leftJoin('reservations as res', 'c.id', 'res.customer_id')
    .leftJoin('reviews as rev', 'c.id', 'rev.customer_id')
    .groupBy('c.id', 'c.first_name', 'c.last_name')
    .limit(limit); qc++
  return { duration: performance.now() - start, queryCount: qc, resultCount: limit }
}

// ============ EXPORT BENCHMARK RUNNER ============

const SCENARIOS = [
  {
    id: 'cars',
    name: 'Cars + Relations',
    description: 'Fetch 100 cars with category, agency & review stats',
    icon: '🚗',
    strength: 'Shows classic N+1 problem — each car triggers 3 sub-queries',
    naive: carsNaive,
    dataloader: carsDataLoader,
    joinmonster: carsJoinMonster
  },
  {
    id: 'reservations',
    name: 'Reservations (Deep Nesting)',
    description: 'Fetch 100 reservations with customer + car → category + agency (3 levels)',
    icon: '📅',
    strength: 'Deep nesting amplifies N+1 — DataLoader batches per depth level, JM flattens all',
    naive: reservationsNaive,
    dataloader: reservationsDataLoader,
    joinmonster: reservationsJoinMonster
  },
  {
    id: 'customers',
    name: 'Customer Dashboard (Aggregation)',
    description: 'Fetch 50 customers with reservation count, total spent, avg rating',
    icon: '👥',
    strength: 'Aggregation queries — JM uses SQL GROUP BY, DL batches aggregate sub-queries',
    naive: customersNaive,
    dataloader: customersDataLoader,
    joinmonster: customersJoinMonster
  }
]

export async function runAllBenchmarks() {
  const results = []

  for (const scenario of SCENARIOS) {
    const naive = await scenario.naive()
    const dataloader = await scenario.dataloader()
    const joinmonster = await scenario.joinmonster()

    results.push({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      icon: scenario.icon,
      strength: scenario.strength,
      naive,
      dataloader,
      joinmonster
    })
  }

  return results
}

// Keep backward compat for the old single endpoint
export const resolveNaive = carsNaive
export const resolveDataLoader = carsDataLoader
export const resolveJoinMonster = carsJoinMonster
