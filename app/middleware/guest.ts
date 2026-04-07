export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, isLoading, fetchUser } = useAuth()

  // Fetch user if not loaded yet
  if (isLoading.value) {
    await fetchUser()
  }

  // Redirect to home if already authenticated
  if (isAuthenticated.value) {
    return navigateTo('/')
  }
})
