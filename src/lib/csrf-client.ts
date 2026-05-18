/**
 * Client-side CSRF token utilities
 * This file is safe to import in client components
 */

let cachedCsrfToken: string | null = null

/**
 * Get CSRF token - fetches from API and caches it
 * This is a client-side only function
 */
export async function getCsrfToken(): Promise<string> {
  if (typeof window === 'undefined') {
    console.warn('getCsrfToken called on server side')
    return ''
  }

  // Return cached token if available
  if (cachedCsrfToken) {
    return cachedCsrfToken
  }

  // Fetch from API
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include'
    })
    
    if (!response.ok) {
      console.error('Failed to fetch CSRF token:', response.status)
      return ''
    }
    
    const data = await response.json()
    const token = data.csrfToken || ''
    cachedCsrfToken = token
    return token
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    return ''
  }
}

/**
 * Get CSRF token synchronously (may return empty if not cached)
 * Use getCsrfToken() (async) for guaranteed token
 */
export function getCsrfTokenSync(): string {
  return cachedCsrfToken ?? ''
}

/**
 * Clear cached CSRF token (use after logout)
 */
export function clearCsrfToken(): void {
  cachedCsrfToken = null
}
