import { z } from 'zod'
import { createUser, findUserByEmail, createSession } from '../../utils/db'

const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, SignupSchema.parse)

  // Check if user already exists
  const existingUser = findUserByEmail(body.email)
  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email already registered'
    })
  }

  // Create user
  const user = createUser(body.name, body.email, body.password)

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
    user,
    message: 'Account created successfully'
  }
})
