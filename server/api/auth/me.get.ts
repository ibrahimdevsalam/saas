import { findSessionById, findUserById } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'session_id')

  if (!sessionId) {
    return { user: null }
  }

  const session = findSessionById(sessionId)

  if (!session) {
    // Clear invalid session cookie
    deleteCookie(event, 'session_id', {
      path: '/'
    })
    return { user: null }
  }

  const user = findUserById(session.user_id)

  if (!user) {
    return { user: null }
  }

  return { user }
})
