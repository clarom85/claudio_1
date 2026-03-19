const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    if (res.status === 401) {
      // Try refresh
      const refreshed = await this.refreshToken()
      if (refreshed) {
        return this.request(path, options)
      }
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(err.message || 'Request failed')
    }

    return res.json()
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) return false

      const { data } = await res.json()
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      return true
    } catch {
      return false
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path)
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
