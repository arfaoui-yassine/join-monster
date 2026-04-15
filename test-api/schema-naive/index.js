import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLSchema
} from 'graphql'

import knex from '../data/database'

// Track query count per request
function createQueryTracker() {
  let count = 0
  const startTime = process.hrtime.bigint()

  const query = (sql) => {
    count++
    return knex.raw(sql).then(result => {
      if (knex.client.config.client === 'mysql') return result[0]
      return result
    })
  }

  return {
    query,
    getCount: () => count,
    getElapsed: () => {
      const end = process.hrtime.bigint()
      return Number(end - startTime) / 1e6
    }
  }
}

// ============ TYPES ============

const CommentType = new GraphQLObjectType({
  name: 'Comment',
  fields: () => ({
    id: { type: GraphQLInt },
    body: { type: GraphQLString },
    post_id: { type: GraphQLInt },
    author_id: { type: GraphQLInt },
    archived: { type: GraphQLBoolean },
    created_at: { type: GraphQLString },
    author: {
      type: UserType,
      // N+1: individual query for each comment's author
      resolve: (comment, args, context) => {
        return context.tracker.query(
          `SELECT * FROM accounts WHERE id = ${comment.author_id}`
        ).then(rows => rows[0] || null)
      }
    },
    post: {
      type: PostType,
      resolve: (comment, args, context) => {
        return context.tracker.query(
          `SELECT * FROM posts WHERE id = ${comment.post_id}`
        ).then(rows => rows[0] || null)
      }
    }
  })
})

const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: GraphQLInt },
    body: { type: GraphQLString },
    author_id: { type: GraphQLInt },
    archived: { type: GraphQLBoolean },
    created_at: { type: GraphQLString },
    author: {
      type: UserType,
      // N+1: individual query for each post's author
      resolve: (post, args, context) => {
        return context.tracker.query(
          `SELECT * FROM accounts WHERE id = ${post.author_id}`
        ).then(rows => rows[0] || null)
      }
    },
    comments: {
      type: new GraphQLList(CommentType),
      // N+1: individual query for each post's comments
      resolve: (post, args, context) => {
        return context.tracker.query(
          `SELECT * FROM comments WHERE post_id = ${post.id}`
        )
      }
    },
    numComments: {
      type: GraphQLInt,
      resolve: (post, args, context) => {
        return context.tracker.query(
          `SELECT count(*) as cnt FROM comments WHERE post_id = ${post.id}`
        ).then(rows => rows[0].cnt)
      }
    }
  })
})

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLInt },
    email_address: { type: GraphQLString },
    first_name: { type: GraphQLString },
    last_name: { type: GraphQLString },
    created_at: { type: GraphQLString },
    fullName: {
      type: GraphQLString,
      resolve: user => `${user.first_name} ${user.last_name}`
    },
    posts: {
      type: new GraphQLList(PostType),
      // N+1: individual query for each user's posts
      resolve: (user, args, context) => {
        return context.tracker.query(
          `SELECT * FROM posts WHERE author_id = ${user.id}`
        )
      }
    },
    comments: {
      type: new GraphQLList(CommentType),
      // N+1: individual query for each user's comments
      resolve: (user, args, context) => {
        return context.tracker.query(
          `SELECT * FROM comments WHERE author_id = ${user.id}`
        )
      }
    },
    following: {
      type: new GraphQLList(UserType),
      resolve: (user, args, context) => {
        return context.tracker.query(
          `SELECT a.* FROM accounts a INNER JOIN relationships r ON r.followee_id = a.id WHERE r.follower_id = ${user.id}`
        )
      }
    }
  })
})

// ============ MUTATIONS ============

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createUser: {
      type: UserType,
      args: {
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        email_address: { type: GraphQLString }
      },
      resolve: async (parent, args, context) => {
        await context.tracker.query(
          `INSERT INTO accounts (first_name, last_name, email_address) VALUES ('${args.first_name}', '${args.last_name}', '${args.email_address}')`
        )
        const rows = await context.tracker.query('SELECT * FROM accounts ORDER BY id DESC LIMIT 1')
        return rows[0]
      }
    },
    createPost: {
      type: PostType,
      args: {
        body: { type: GraphQLString },
        author_id: { type: GraphQLInt }
      },
      resolve: async (parent, args, context) => {
        await context.tracker.query(
          `INSERT INTO posts (body, author_id) VALUES ('${args.body}', ${args.author_id})`
        )
        const rows = await context.tracker.query('SELECT * FROM posts ORDER BY id DESC LIMIT 1')
        return rows[0]
      }
    },
    createComment: {
      type: CommentType,
      args: {
        body: { type: GraphQLString },
        post_id: { type: GraphQLInt },
        author_id: { type: GraphQLInt }
      },
      resolve: async (parent, args, context) => {
        await context.tracker.query(
          `INSERT INTO comments (body, post_id, author_id) VALUES ('${args.body}', ${args.post_id}, ${args.author_id})`
        )
        const rows = await context.tracker.query('SELECT * FROM comments ORDER BY id DESC LIMIT 1')
        return rows[0]
      }
    },
    deleteUser: {
      type: UserType,
      args: { id: { type: GraphQLInt } },
      resolve: async (parent, args, context) => {
        const rows = await context.tracker.query(`SELECT * FROM accounts WHERE id = ${args.id}`)
        await context.tracker.query(`DELETE FROM accounts WHERE id = ${args.id}`)
        return rows[0]
      }
    },
    deletePost: {
      type: PostType,
      args: { id: { type: GraphQLInt } },
      resolve: async (parent, args, context) => {
        const rows = await context.tracker.query(`SELECT * FROM posts WHERE id = ${args.id}`)
        await context.tracker.query(`DELETE FROM posts WHERE id = ${args.id}`)
        return rows[0]
      }
    },
    deleteComment: {
      type: CommentType,
      args: { id: { type: GraphQLInt } },
      resolve: async (parent, args, context) => {
        const rows = await context.tracker.query(`SELECT * FROM comments WHERE id = ${args.id}`)
        await context.tracker.query(`DELETE FROM comments WHERE id = ${args.id}`)
        return rows[0]
      }
    }
  })
})

// ============ QUERY ROOT ============

const QueryRoot = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    users: {
      type: new GraphQLList(UserType),
      resolve: (parent, args, context) => {
        return context.tracker.query('SELECT * FROM accounts')
      }
    },
    user: {
      type: UserType,
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args, context) => {
        return context.tracker.query(
          `SELECT * FROM accounts WHERE id = ${args.id}`
        ).then(rows => rows[0] || null)
      }
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: (parent, args, context) => {
        return context.tracker.query('SELECT * FROM posts')
      }
    },
    post: {
      type: PostType,
      args: { id: { type: GraphQLInt } },
      resolve: (parent, args, context) => {
        return context.tracker.query(
          `SELECT * FROM posts WHERE id = ${args.id}`
        ).then(rows => rows[0] || null)
      }
    },
    comments: {
      type: new GraphQLList(CommentType),
      resolve: (parent, args, context) => {
        return context.tracker.query('SELECT * FROM comments')
      }
    }
  })
})

export const schema = new GraphQLSchema({
  query: QueryRoot,
  mutation: MutationType
})

export { createQueryTracker }
