import { EventEmitter } from "events"

export interface UserStatusEvent {
  type: "user_disabled" | "user_enabled"
  userId: number
}

class UserEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(200)
  }

  emitUserDisabled(userId: number) {
    this.emit("user:status", { type: "user_disabled", userId } satisfies UserStatusEvent)
  }

  emitUserEnabled(userId: number) {
    this.emit("user:status", { type: "user_enabled", userId } satisfies UserStatusEvent)
  }

  onStatusChange(handler: (event: UserStatusEvent) => void) {
    this.on("user:status", handler)
    return () => this.off("user:status", handler)
  }
}

declare global {
  // eslint-disable-next-line no-var
  var userEventBus: UserEventBus | undefined
}

export const userEventBus: UserEventBus =
  global.userEventBus ?? new UserEventBus()

if (process.env.NODE_ENV !== "production") {
  global.userEventBus = userEventBus
}
