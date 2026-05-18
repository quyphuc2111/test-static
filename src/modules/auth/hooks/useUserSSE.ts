"use client"

import { useEffect, useRef } from "react"

/**
 * SSE hook lắng nghe event user bị vô hiệu hoá.
 * Khi nhận được event "user_disabled" → redirect về login ngay lập tức.
 */
export function useUserSSE(userId: string | number | undefined) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!userId) return

    let isMounted = true

    function connect() {
      if (!isMounted) return

      const es = new EventSource("/api/user-events")
      eventSourceRef.current = es

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "user_disabled" && data.userId === Number(userId)) {
            // Force logout ngay lập tức
            es.close()
            window.location.href = "/login?reason=disabled"
          }
        } catch {
          // Ignore parse errors (heartbeats)
        }
      }

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      isMounted = false
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [userId])
}
