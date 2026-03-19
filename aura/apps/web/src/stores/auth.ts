import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken })
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null })
      },
    }),
    { name: 'aura-auth', partialize: (s) => ({ user: s.user }) }
  )
)
