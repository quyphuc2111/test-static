import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasAnyPermission } from "@/lib/permissions"
import { PermissionName, Prisma } from "@prisma/client"
import { logContentAction } from "@/lib/audit"
import { mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

function sanitizeName(value: string): string {
  return (value || "").normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_')
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: projectId, moduleId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)

    const canCreate = await hasAnyPermission([
      PermissionName.EDIT_CONTENT,
      PermissionName.MANAGE_OWN_CONTENT
    ], session.user.id)
    if (!canCreate) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const items: Array<{ title: string; description?: any; contentType?: 'FILE_ZIP_HTML' | 'FILE_ZIP_SCORM' }> = body?.items || []
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items to import" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id: pId as any } })
    const module = await prisma.module.findUnique({ where: { id: mId as any } })
    if (!project || !module) return NextResponse.json({ error: "Project or Module not found" }, { status: 404 })

    const created: any[] = []
    for (const raw of items) {
      const title = (raw.title || "").toString().trim()
      if (!title) continue

      // Ensure a placeholder directory for future file upload
      const timestamp = Date.now()
      const dirName = `${sanitizeName(title)}_${timestamp}`
      const baseDir = join(
        process.cwd(),
        "public",
        "uploads",
        "content",
        sanitizeName(project.name),
        sanitizeName(module.name),
        dirName
      )
      if (!existsSync(baseDir)) {
        await mkdir(baseDir, { recursive: true })
      }

      const relativePath = baseDir.replace(process.cwd() + '/public', '')

      const description = (() => {
        const d = raw.description
        if (d == null) return null
        if (typeof d === 'object') return d as Prisma.InputJsonValue
        try { return JSON.parse(String(d)) as Prisma.InputJsonValue } catch { return { text: String(d) } as any }
      })()

      const content = await prisma.contentData.create({
        data: {
          title,
          description,
          contentType: (raw.contentType || 'FILE_ZIP_HTML') as any,
          contentUrl: relativePath,
          status: 'PROCESSING' as any,
          progress: 0,
          projectId: pId as any,
          moduleId: mId as any,
          ownerId: Number(session.user.id) as any,
        } as any
      })
      created.push(content)
    }
    
    // Log audit for each imported content
    for (const item of created) {
      await logContentAction(
        session.user.id,
        'imported',
        String(item.id),
        {
          contentTitle: item.title,
          source: 'import',
          count: created.length
        }
      )
    }

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



