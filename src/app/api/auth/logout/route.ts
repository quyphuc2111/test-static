import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createAuditLog } from "@/lib/audit"

export async function POST() {
  const session = await getSession()
  
  // Log audit for logout BEFORE destroying session
  if (session?.user?.id) {
    await createAuditLog({
      actorId: session.user.id,
      action: 'logout',
      entityType: 'User',
      entityId: String(session.user.id),
      metadata: {
        userName: session.user.name,
        email: session.user.email,
        username: session.user.username
      }
    })
  }
  
  session.destroy()
  return NextResponse.json({ success: true })
}


