export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const authState = reactive<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true
})

export function useAuth() {
  const toast = useToast()

  async function fetchUser() {
    authState.isLoading = true
    try {
      const { data } = await useFetch('/api/auth/me')
      if (data.value?.user) {
        authState.user = data.value.user
        authState.isAuthenticated = true
      } else {
        authState.user = null
        authState.isAuthenticated = false
      }
    } catch {
      authState.user = null
      authState.isAuthenticated = false
    } finally {
      authState.isLoading = false
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      authState.user = response.user
      authState.isAuthenticated = true

      toast.add({
        title: 'Welcome back!',
        description: `Logged in as ${response.user.name}`,
        color: 'success'
      })

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.add({
        title: 'Login failed',
        description: message,
        color: 'error'
      })
      return { success: false, error: message }
    }
  }

  async function signup(name: string, email: string, password: string) {
    try {
      const response = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: { name, email, password }
      })

      authState.user = response.user
      authState.isAuthenticated = true

      toast.add({
        title: 'Account created!',
        description: 'Welcome to the platform',
        color: 'success'
      })

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed'
      toast.add({
        title: 'Signup failed',
        description: message,
        color: 'error'
      })
      return { success: false, error: message }
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })

      authState.user = null
      authState.isAuthenticated = false

      toast.add({
        title: 'Logged out',
        description: 'See you later!',
        color: 'info'
      })

      await navigateTo('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    user: computed(() => authState.user),
    isAuthenticated: computed(() => authState.isAuthenticated),
    isLoading: computed(() => authState.isLoading),
    login,
    signup,
    logout,
    fetchUser
  }
}
