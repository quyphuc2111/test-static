"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

interface ContentStatusEvent {
  type: "status_changed"
  contentId: number
  projectId: number
  moduleId: number
  status: string
  progress?: number
}

export function useContentSSE(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const invalidateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const latestToastStatusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!projectId || !moduleId) return

    let isMounted = true

    function connect() {
      if (!isMounted) return

      const es = new EventSource("/api/content-events")
      eventSourceRef.current = es

      es.onmessage = (event) => {
        try {
          const data: ContentStatusEvent = JSON.parse(event.data)

          // Only react to events for current project/module
          if (
            String(data.projectId) !== projectId ||
            String(data.moduleId) !== moduleId
          ) return

          // Debounce invalidation so a burst of SSE progress/status events does
          // not trigger many back-to-back API refetches and UI re-renders.
          if (invalidateTimeoutRef.current) {
            clearTimeout(invalidateTimeoutRef.current)
          }

          invalidateTimeoutRef.current = setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: cachedKeys.content.list(projectId, moduleId),
            })
            queryClient.invalidateQueries({
              queryKey: cachedKeys.content.stats(projectId),
            })
          }, 500)

          const toastKey = `${data.contentId}:${data.status}`
          if (data.status === "COMPLETED" && latestToastStatusRef.current !== toastKey) {
            latestToastStatusRef.current = toastKey
            toast.success("Xử lý file hoàn tất!")
          } else if (data.status === "FAILED" && latestToastStatusRef.current !== toastKey) {
            latestToastStatusRef.current = toastKey
            toast.error("Xử lý file thất bại!")
          }
        } catch {
          // Ignore parse errors (heartbeats, etc.)
        }
      }

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null
        // Reconnect after 3s
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000)
        }
      }
    }

    connect()

    return () => {
      isMounted = false
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [projectId, moduleId, queryClient])
}
