import { z } from 'zod'
import { findUserByEmail, verifyPassword, createSession } from '../../utils/db'

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, LoginSchema.parse)

  // Find user
  const user = findUserByEmail(body.email)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password'
    })
  }

  // Verify password
  if (!verifyPassword(user, body.password)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password'
    })
  }

  // Create session
  const session = createSession(user.id)

  // Set session cookie
  setCookie(event, 'session_id', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    },
    message: 'Logged in successfully'
  }
})
