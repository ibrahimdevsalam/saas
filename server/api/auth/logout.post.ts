import { deleteSession } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'session_id')

  if (sessionId) {
    deleteSession(sessionId)
  }

  // Clear session cookie
  deleteCookie(event, 'session_id', {
    path: '/'
  })

  return {
    message: 'Logged out successfully'
  }
})
