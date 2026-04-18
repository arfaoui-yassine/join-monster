import knex from 'knex'

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.CR_DB_HOST || '127.0.0.1',
    port: parseInt(process.env.CR_DB_PORT || '3307'),
    user: process.env.CR_DB_USER || 'root',
    password: process.env.CR_DB_PASSWORD || '1234',
    database: process.env.CR_DB_NAME || 'car_rental',
    typeCast(field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1'
      }
      return next()
    }
  },
  pool: { min: 0, max: 10 }
})

export default db
