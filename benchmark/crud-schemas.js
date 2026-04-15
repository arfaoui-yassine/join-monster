import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInputObjectType
} from 'graphql'
import DataLoader from 'dataloader'
import joinMonster from '../src/index'
import sqlite3Module from '../src/stringifiers/dialects/sqlite3'
import {
  createCrudUser,
  crudTableName,
  deleteCrudUser,
  getCrudUser,
  listCrudUsers,
  mapCrudUser,
  updateCrudUser
} from './crud-store'

const crudInputType = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    emailAddress: { type: GraphQLString },
    numLegs: { type: GraphQLInt }
  }
})

function buildLoaders(db, trackDbQuery) {
  return {
    userById: new DataLoader(async ids => {
      trackDbQuery()
      const rows = await db(crudTableName()).whereIn('id', ids)
      const lookup = new Map(rows.map(row => [row.id, mapCrudUser(row)]))
      return ids.map(id => lookup.get(id) || null)
    })
  }
}

function createCrudUserType(strategy) {
  return new GraphQLObjectType({
    name: `${strategy === 'naive' ? 'Naive' : strategy === 'dataloader' ? 'DataLoader' : 'Optimized'}CrudUser`,
    extensions:
      strategy === 'optimized'
        ? {
            joinMonster: {
              sqlTable: crudTableName(),
              uniqueKey: 'id'
            }
          }
        : undefined,
    fields: () => ({
      id: { type: GraphQLInt },
      firstName: {
        type: GraphQLString,
        extensions:
          strategy === 'optimized'
            ? {
                joinMonster: {
                  sqlColumn: 'first_name'
                }
              }
            : undefined
      },
      lastName: {
        type: GraphQLString,
        extensions:
          strategy === 'optimized'
            ? {
                joinMonster: {
                  sqlColumn: 'last_name'
                }
              }
            : undefined
      },
      emailAddress: {
        type: GraphQLString,
        extensions:
          strategy === 'optimized'
            ? {
                joinMonster: {
                  sqlColumn: 'email_address'
                }
              }
            : undefined
      },
      numLegs: {
        type: GraphQLInt,
        extensions:
          strategy === 'optimized'
            ? {
                joinMonster: {
                  sqlColumn: 'num_legs'
                }
              }
            : undefined
      },
      fullName: {
        type: GraphQLString,
        extensions:
          strategy === 'optimized'
            ? {
                joinMonster: {
                  sqlDeps: ['first_name', 'last_name']
                }
              }
            : undefined,
        resolve: row => `${row.firstName || row.first_name || ''} ${row.lastName || row.last_name || ''}`.trim()
      }
    })
  })
}

function createQueryFields(strategy, CrudUserType) {
  return {
    users: {
      type: new GraphQLList(CrudUserType),
      args: {
        limit: { type: GraphQLInt }
      },
      extensions:
        strategy === 'optimized'
          ? {
              joinMonster: {
                orderBy: 'id'
              }
            }
          : undefined,
      resolve: async (parent, args, context, resolveInfo) => {
        const limit = args.limit || 12
        if (strategy === 'optimized') {
          return joinMonster(
            resolveInfo,
            context,
            sql => {
              context.trackDbQuery()
              return context.db.raw(sql)
            },
            {
              dialectModule: sqlite3Module
            }
          )
        }

        context.trackDbQuery()
        const users = await listCrudUsers(context.db, limit)
        return users
      }
    },
    user: {
      type: CrudUserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      extensions:
        strategy === 'optimized'
          ? {
              joinMonster: {
                where: (table, args) => `${table}.id = ${args.id}`
              }
            }
          : undefined,
      resolve: async (parent, args, context, resolveInfo) => {
        if (strategy === 'dataloader') {
          return context.loaders.userById.load(args.id)
        }

        if (strategy === 'optimized') {
          return joinMonster(
            resolveInfo,
            context,
            sql => {
              context.trackDbQuery()
              return context.db.raw(sql)
            },
            {
              dialectModule: sqlite3Module
            }
          )
        }

        context.trackDbQuery()
        return getCrudUser(context.db, args.id)
      }
    }
  }
}

export function createCrudContext(strategy, db, trackDbQuery) {
  const context = {
    db,
    trackDbQuery
  }

  if (strategy === 'dataloader') {
    context.loaders = buildLoaders(db, trackDbQuery)
  }

  return context
}

export function createCrudSchema(strategy) {
  const CrudUserType = createCrudUserType(strategy)
  const QueryType = new GraphQLObjectType({
    name: `${strategy === 'naive' ? 'Naive' : strategy === 'dataloader' ? 'DataLoader' : 'Optimized'}CrudQuery`,
    fields: createQueryFields(strategy, CrudUserType)
  })

  const MutationType = new GraphQLObjectType({
    name: `${strategy === 'naive' ? 'Naive' : strategy === 'dataloader' ? 'DataLoader' : 'Optimized'}CrudMutation`,
    fields: {
      createUser: {
        type: CrudUserType,
        args: {
          input: { type: new GraphQLNonNull(crudInputType) }
        },
        resolve: async (parent, args, context) => {
          context.trackDbQuery()
          return createCrudUser(context.db, args.input)
        }
      },
      updateUser: {
        type: CrudUserType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLInt) },
          input: { type: new GraphQLNonNull(crudInputType) }
        },
        resolve: async (parent, args, context) => {
          context.trackDbQuery()
          return updateCrudUser(context.db, args.id, args.input)
        }
      },
      deleteUser: {
        type: CrudUserType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: async (parent, args, context) => {
          context.trackDbQuery()
          return deleteCrudUser(context.db, args.id)
        }
      }
    }
  })

  return new GraphQLSchema({ query: QueryType, mutation: MutationType })
}
