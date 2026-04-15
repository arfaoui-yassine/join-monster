import { Router } from 'express'
import knex from './data/database'

const router = Router()

// Middleware to track query count and timing
function withMetrics(handler) {
  return async (req, res, next) => {
    const start = process.hrtime.bigint()
    let queryCount = 0
    
    // Wrap knex.raw to count queries
    const originalRaw = knex.raw.bind(knex)
    const countingRaw = (...args) => {
      queryCount++
      return originalRaw(...args)
    }

    req.dbQuery = countingRaw
    req.queryCount = () => queryCount

    try {
      const result = await handler(req, res, countingRaw)
      const end = process.hrtime.bigint()
      const executionTimeMs = Number(end - start) / 1e6

      res.set('X-Query-Count', String(queryCount))
      res.set('X-Execution-Time', String(executionTimeMs.toFixed(2)))
      res.set('Access-Control-Expose-Headers', 'X-Query-Count, X-Execution-Time')
      res.json({
        data: result,
        _meta: {
          strategy: 'REST',
          queryCount,
          executionTimeMs: parseFloat(executionTimeMs.toFixed(2))
        }
      })
    } catch (err) {
      next(err)
    }
  }
}

// ============ USERS ============

// GET /users - List all users (N+1: fetches posts and comments separately for each)
router.get('/users', withMetrics(async (req, res, db) => {
  const users = await db('SELECT * FROM accounts')
  
  // N+1: For each user, fetch their posts
  for (const user of users) {
    const posts = await db(`SELECT * FROM posts WHERE author_id = ${user.id}`)
    user.posts = posts

    // N+1 within N+1: For each post, fetch comments
    for (const post of posts) {
      const comments = await db(`SELECT * FROM comments WHERE post_id = ${post.id}`)
      post.comments = comments

      // And for each comment, fetch the author
      for (const comment of comments) {
        const [author] = await db(`SELECT * FROM accounts WHERE id = ${comment.author_id}`)
        comment.author = author || null
      }
    }
  }

  return users
}))

// GET /users/:id - Single user with nested data
router.get('/users/:id', withMetrics(async (req, res, db) => {
  const [user] = await db(`SELECT * FROM accounts WHERE id = ${req.params.id}`)
  if (!user) {
    res.status(404)
    return { error: 'User not found' }
  }

  const posts = await db(`SELECT * FROM posts WHERE author_id = ${user.id}`)
  user.posts = posts

  for (const post of posts) {
    const comments = await db(`SELECT * FROM comments WHERE post_id = ${post.id}`)
    post.comments = comments

    for (const comment of comments) {
      const [author] = await db(`SELECT * FROM accounts WHERE id = ${comment.author_id}`)
      comment.author = author || null
    }
  }

  const following = await db(
    `SELECT a.* FROM accounts a 
     INNER JOIN relationships r ON r.followee_id = a.id 
     WHERE r.follower_id = ${user.id}`
  )
  user.following = following

  return user
}))

// POST /users - Create user
router.post('/users', withMetrics(async (req, res, db) => {
  const { first_name, last_name, email_address } = req.body
  await db(
    `INSERT INTO accounts (first_name, last_name, email_address) VALUES ('${first_name}', '${last_name}', '${email_address}')`
  )
  const [user] = await db('SELECT * FROM accounts ORDER BY id DESC LIMIT 1')
  return user
}))

// PUT /users/:id - Update user
router.put('/users/:id', withMetrics(async (req, res, db) => {
  const { first_name, last_name, email_address } = req.body
  const sets = []
  if (first_name) sets.push(`first_name = '${first_name}'`)
  if (last_name) sets.push(`last_name = '${last_name}'`)
  if (email_address) sets.push(`email_address = '${email_address}'`)
  
  if (sets.length > 0) {
    await db(`UPDATE accounts SET ${sets.join(', ')} WHERE id = ${req.params.id}`)
  }
  const [user] = await db(`SELECT * FROM accounts WHERE id = ${req.params.id}`)
  return user
}))

// DELETE /users/:id
router.delete('/users/:id', withMetrics(async (req, res, db) => {
  await db(`DELETE FROM accounts WHERE id = ${req.params.id}`)
  return { deleted: true, id: parseInt(req.params.id) }
}))

// ============ POSTS ============

router.get('/posts', withMetrics(async (req, res, db) => {
  const posts = await db('SELECT * FROM posts')
  
  for (const post of posts) {
    const [author] = await db(`SELECT * FROM accounts WHERE id = ${post.author_id}`)
    post.author = author || null

    const comments = await db(`SELECT * FROM comments WHERE post_id = ${post.id}`)
    post.comments = comments
  }

  return posts
}))

router.get('/posts/:id', withMetrics(async (req, res, db) => {
  const [post] = await db(`SELECT * FROM posts WHERE id = ${req.params.id}`)
  if (!post) {
    res.status(404)
    return { error: 'Post not found' }
  }

  const [author] = await db(`SELECT * FROM accounts WHERE id = ${post.author_id}`)
  post.author = author || null

  const comments = await db(`SELECT * FROM comments WHERE post_id = ${post.id}`)
  post.comments = comments

  for (const comment of comments) {
    const [commentAuthor] = await db(`SELECT * FROM accounts WHERE id = ${comment.author_id}`)
    comment.author = commentAuthor || null
  }

  return post
}))

router.post('/posts', withMetrics(async (req, res, db) => {
  const { body, author_id } = req.body
  await db(
    `INSERT INTO posts (body, author_id) VALUES ('${body}', ${author_id})`
  )
  const [post] = await db('SELECT * FROM posts ORDER BY id DESC LIMIT 1')
  return post
}))

router.put('/posts/:id', withMetrics(async (req, res, db) => {
  const { body } = req.body
  if (body) {
    await db(`UPDATE posts SET body = '${body}' WHERE id = ${req.params.id}`)
  }
  const [post] = await db(`SELECT * FROM posts WHERE id = ${req.params.id}`)
  return post
}))

router.delete('/posts/:id', withMetrics(async (req, res, db) => {
  await db(`DELETE FROM posts WHERE id = ${req.params.id}`)
  return { deleted: true, id: parseInt(req.params.id) }
}))

// ============ COMMENTS ============

router.get('/comments', withMetrics(async (req, res, db) => {
  const comments = await db('SELECT * FROM comments')
  
  for (const comment of comments) {
    const [author] = await db(`SELECT * FROM accounts WHERE id = ${comment.author_id}`)
    comment.author = author || null
    
    const [post] = await db(`SELECT * FROM posts WHERE id = ${comment.post_id}`)
    comment.post = post || null
  }

  return comments
}))

router.get('/comments/:id', withMetrics(async (req, res, db) => {
  const [comment] = await db(`SELECT * FROM comments WHERE id = ${req.params.id}`)
  if (!comment) {
    res.status(404)
    return { error: 'Comment not found' }
  }

  const [author] = await db(`SELECT * FROM accounts WHERE id = ${comment.author_id}`)
  comment.author = author || null
  
  const [post] = await db(`SELECT * FROM posts WHERE id = ${comment.post_id}`)
  comment.post = post || null

  return comment
}))

router.post('/comments', withMetrics(async (req, res, db) => {
  const { body, post_id, author_id } = req.body
  await db(
    `INSERT INTO comments (body, post_id, author_id) VALUES ('${body}', ${post_id}, ${author_id})`
  )
  const [comment] = await db('SELECT * FROM comments ORDER BY id DESC LIMIT 1')
  return comment
}))

router.delete('/comments/:id', withMetrics(async (req, res, db) => {
  await db(`DELETE FROM comments WHERE id = ${req.params.id}`)
  return { deleted: true, id: parseInt(req.params.id) }
}))

export default router
