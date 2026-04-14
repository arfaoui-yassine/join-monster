import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql'
import joinMonster from '../src/index'
import sqlite3Module from '../src/stringifiers/dialects/sqlite3'

function toUser(row) {
  return {
    ...row,
    fullName: `${row.first_name} ${row.last_name}`
  }
}

export function createNaiveSchema() {
  const CommentType = new GraphQLObjectType({
    name: 'NaiveComment',
    fields: {
      id: { type: GraphQLInt },
      body: { type: GraphQLString }
    }
  })

  const PostType = new GraphQLObjectType({
    name: 'NaivePost',
    fields: {
      id: { type: GraphQLInt },
      body: { type: GraphQLString },
      comments: {
        type: new GraphQLList(CommentType),
        resolve: async (post, args, context) => {
          context.trackDbQuery()
          return context.db('comments').select('id', 'body', 'post_id').where({ post_id: post.id })
        }
      }
    }
  })

  const UserType = new GraphQLObjectType({
    name: 'NaiveUser',
    fields: {
      id: { type: GraphQLInt },
      fullName: { type: GraphQLString },
      posts: {
        type: new GraphQLList(PostType),
        resolve: async (user, args, context) => {
          context.trackDbQuery()
          return context.db('posts').select('id', 'body', 'author_id').where({ author_id: user.id })
        }
      }
    }
  })

  const QueryType = new GraphQLObjectType({
    name: 'NaiveQuery',
    fields: {
      users: {
        type: new GraphQLList(UserType),
        args: {
          limit: { type: GraphQLInt }
        },
        resolve: async (parent, args, context) => {
          const limit = args.limit || 10
          context.trackDbQuery()
          const users = await context.db('accounts')
            .select('id', 'first_name', 'last_name')
            .orderBy('id', 'asc')
            .limit(limit)
          return users.map(toUser)
        }
      }
    }
  })

  return new GraphQLSchema({ query: QueryType })
}

export function createOptimizedSchema() {
  const CommentType = new GraphQLObjectType({
    name: 'OptimizedComment',
    extensions: {
      joinMonster: {
        sqlTable: 'comments',
        uniqueKey: 'id'
      }
    },
    fields: {
      id: { type: GraphQLInt },
      body: { type: GraphQLString },
      postId: {
        type: GraphQLInt,
        extensions: {
          joinMonster: {
            sqlColumn: 'post_id'
          }
        }
      }
    }
  })

  const PostType = new GraphQLObjectType({
    name: 'OptimizedPost',
    extensions: {
      joinMonster: {
        sqlTable: 'posts',
        uniqueKey: 'id'
      }
    },
    fields: () => ({
      id: { type: GraphQLInt },
      body: { type: GraphQLString },
      comments: {
        type: new GraphQLList(CommentType),
        extensions: {
          joinMonster: {
            sqlJoin: (postTable, commentTable) => `${commentTable}.post_id = ${postTable}.id`
          }
        }
      }
    })
  })

  const UserType = new GraphQLObjectType({
    name: 'OptimizedUser',
    extensions: {
      joinMonster: {
        sqlTable: 'accounts',
        uniqueKey: 'id'
      }
    },
    fields: () => ({
      id: { type: GraphQLInt },
      fullName: {
        type: GraphQLString,
        extensions: {
          joinMonster: {
            sqlDeps: ['first_name', 'last_name']
          }
        },
        resolve: row => `${row.first_name} ${row.last_name}`
      },
      posts: {
        type: new GraphQLList(PostType),
        extensions: {
          joinMonster: {
            sqlJoin: (userTable, postTable) => `${postTable}.author_id = ${userTable}.id`
          }
        }
      }
    })
  })

  const QueryType = new GraphQLObjectType({
    name: 'OptimizedQuery',
    fields: {
      users: {
        type: new GraphQLList(UserType),
        args: {
          limit: { type: GraphQLInt }
        },
        extensions: {
          joinMonster: {
            orderBy: 'id'
          }
        },
        resolve: (parent, args, context, resolveInfo) => {
          const options = {
            dialectModule: sqlite3Module
          }
          return joinMonster(
            resolveInfo,
            context,
            sql => {
              context.trackDbQuery()
              return context.db.raw(sql)
            },
            options
          )
        }
      }
    }
  })

  return new GraphQLSchema({ query: QueryType })
}
