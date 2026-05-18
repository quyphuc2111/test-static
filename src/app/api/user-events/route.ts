import { getSession } from "@/lib/session"
import { userEventBus, UserStatusEvent } from "@/lib/user-events"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const currentUserId = Number(session.user.id)
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let heartbeat: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"))

      // Chỉ gửi event liên quan đến user hiện tại
      unsubscribe = userEventBus.onStatusChange((event: UserStatusEvent) => {
        if (event.userId !== currentUserId) return
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch {
          // Client disconnected
        }
      })

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          // Client disconnected
        }
      }, 30000)
    },
    cancel() {
      unsubscribe?.()
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
