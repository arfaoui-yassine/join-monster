import path from 'path'
import knexFactory from 'knex'

const sqlitePath = path.join(__dirname, '..', 'test-api', 'data', 'db', 'test1-data.sl3')

const db = knexFactory({
  client: 'sqlite3',
  connection: { filename: sqlitePath },
  useNullAsDefault: true
})

export default db
