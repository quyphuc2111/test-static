import { EventEmitter } from "events"

export interface ContentStatusEvent {
  type: "status_changed"
  contentId: number
  projectId: number
  moduleId: number
  status: string
  progress?: number
}

// Singleton event emitter — shared across all API routes in the same process
class ContentEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100) // Allow many SSE connections
  }

  emitStatusChange(event: Omit<ContentStatusEvent, "type">) {
    this.emit("content:status", { type: "status_changed", ...event })
  }

  onStatusChange(handler: (event: ContentStatusEvent) => void) {
    this.on("content:status", handler)
    return () => this.off("content:status", handler)
  }
}

// Global singleton (survives HMR in dev)
declare global {
  // eslint-disable-next-line no-var
  var contentEventBus: ContentEventBus | undefined
}

export const contentEventBus: ContentEventBus =
  global.contentEventBus ?? new ContentEventBus()

if (process.env.NODE_ENV !== "production") {
  global.contentEventBus = contentEventBus
}
