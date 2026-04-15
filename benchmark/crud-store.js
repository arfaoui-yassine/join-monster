const CRUD_TABLE = 'benchmark_users'

function toUser(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    emailAddress: row.email_address,
    numLegs: row.num_legs,
    fullName: `${row.first_name} ${row.last_name}`
  }
}

function toDbPayload(input) {
  return {
    first_name: input.firstName || input.first_name || 'Sample',
    last_name: input.lastName || input.last_name || 'User',
    email_address:
      input.emailAddress || input.email_address || `sample-${Date.now()}@example.com`,
    num_legs: Number(input.numLegs || input.num_legs || 2)
  }
}

async function seedCrudTable(db) {
  const rows = await db('accounts')
    .select('first_name', 'last_name', 'email_address', 'num_legs')
    .orderBy('id', 'asc')
    .limit(12)

  if (rows.length > 0) {
    await db(CRUD_TABLE).insert(rows)
  }
}

export async function ensureCrudTable(db) {
  const exists = await db.schema.hasTable(CRUD_TABLE)
  if (!exists) {
    await db.schema.createTable(CRUD_TABLE, table => {
      table.increments('id').primary()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email_address').notNullable()
      table.integer('num_legs').notNullable().defaultTo(2)
    })
    await seedCrudTable(db)
    return
  }

  const countRow = await db(CRUD_TABLE).count({ total: 'id' }).first()
  if (Number(countRow?.total || 0) === 0) {
    await seedCrudTable(db)
  }
}

export async function listCrudUsers(db, limit = 12) {
  const rows = await db(CRUD_TABLE).select('*').orderBy('id', 'asc').limit(limit)
  return rows.map(toUser)
}

export async function getCrudUser(db, id) {
  const row = await db(CRUD_TABLE).where({ id }).first()
  return row ? toUser(row) : null
}

export async function createCrudUser(db, input) {
  const payload = toDbPayload(input)
  const [id] = await db(CRUD_TABLE).insert(payload)
  return getCrudUser(db, id)
}

export async function updateCrudUser(db, id, input) {
  const payload = toDbPayload(input)
  await db(CRUD_TABLE).where({ id }).update(payload)
  return getCrudUser(db, id)
}

export async function deleteCrudUser(db, id) {
  const current = await getCrudUser(db, id)
  if (!current) {
    return null
  }
  await db(CRUD_TABLE).where({ id }).del()
  return current
}

export function mapCrudUser(row) {
  return toUser(row)
}

export function crudTableName() {
  return CRUD_TABLE
}
