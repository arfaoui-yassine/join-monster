import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLSchema
} from 'graphql'

import DataLoader from 'dataloader'
import knex from '../data/database'

function dbQuery(sql) {
  return knex.raw(sql).then(result => {
    if (knex.client.config.client === 'mysql') return result[0]
    return result
  })
}

// Track query count per request
function createQueryTracker() {
  let count = 0
  const startTime = process.hrtime.bigint()

  const query = (sql) => {
    count++
    return dbQuery(sql)
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

// Create DataLoaders (one set per request)
function createLoaders(tracker) {
  const userLoader = new DataLoader(async (ids) => {
    const rows = await tracker.query(
      `SELECT * FROM accounts WHERE id IN (${ids.join(',')})`
    )
    // DataLoader requires results in same order as keys
    return ids.map(id => rows.find(r => r.id === id) || null)
  })

  const postsByAuthorLoader = new DataLoader(async (authorIds) => {
    const rows = await tracker.query(
      `SELECT * FROM posts WHERE author_id IN (${authorIds.join(',')})`
    )
    return authorIds.map(id => rows.filter(r => r.author_id === id))
  })

  const commentsByPostLoader = new DataLoader(async (postIds) => {
    const rows = await tracker.query(
      `SELECT * FROM comments WHERE post_id IN (${postIds.join(',')})`
    )
    return postIds.map(id => rows.filter(r => r.post_id === id))
  })

  const commentsByAuthorLoader = new DataLoader(async (authorIds) => {
    const rows = await tracker.query(
      `SELECT * FROM comments WHERE author_id IN (${authorIds.join(',')})`
    )
    return authorIds.map(id => rows.filter(r => r.author_id === id))
  })

  const followingLoader = new DataLoader(async (followerIds) => {
    const rows = await tracker.query(
      `SELECT a.*, r.follower_id FROM accounts a INNER JOIN relationships r ON r.followee_id = a.id WHERE r.follower_id IN (${followerIds.join(',')})`
    )
    return followerIds.map(id => rows.filter(r => r.follower_id === id))
  })

  return {
    userLoader,
    postsByAuthorLoader,
    commentsByPostLoader,
    commentsByAuthorLoader,
    followingLoader
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
      // DataLoader: batched! Multiple comments' authors fetched in one query
      resolve: (comment, args, context) => {
        return context.loaders.userLoader.load(comment.author_id)
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
      // DataLoader: batched!
      resolve: (post, args, context) => {
        return context.loaders.userLoader.load(post.author_id)
      }
    },
    comments: {
      type: new GraphQLList(CommentType),
      // DataLoader: batched!
      resolve: (post, args, context) => {
        return context.loaders.commentsByPostLoader.load(post.id)
      }
    },
    numComments: {
      type: GraphQLInt,
      resolve: (post, args, context) => {
        return context.loaders.commentsByPostLoader.load(post.id)
          .then(comments => comments.length)
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
      // DataLoader: batched!
      resolve: (user, args, context) => {
        return context.loaders.postsByAuthorLoader.load(user.id)
      }
    },
    comments: {
      type: new GraphQLList(CommentType),
      // DataLoader: batched!
      resolve: (user, args, context) => {
        return context.loaders.commentsByAuthorLoader.load(user.id)
      }
    },
    following: {
      type: new GraphQLList(UserType),
      resolve: (user, args, context) => {
        return context.loaders.followingLoader.load(user.id)
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

export { createLoaders, createQueryTracker }
