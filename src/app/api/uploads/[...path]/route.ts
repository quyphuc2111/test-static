import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { promises as fsp } from "fs"
import { existsSync } from "fs"

function contentTypeFor(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8"
  if (lower.endsWith(".css")) return "text/css; charset=utf-8"
  if (lower.endsWith(".js")) return "application/javascript; charset=utf-8"
  if (lower.endsWith(".json")) return "application/json; charset=utf-8"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".svg")) return "image/svg+xml"
  if (lower.endsWith(".ico")) return "image/x-icon"
  if (lower.endsWith(".woff")) return "font/woff"
  if (lower.endsWith(".woff2")) return "font/woff2"
  return "application/octet-stream"
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const cleanSegments = (path || []).filter(Boolean)
  const rel = cleanSegments.join("/")

  // Block traversal
  if (rel.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  const abs = join(process.cwd(), "public", "uploads", rel)

  try {
    const stat = await fsp.stat(abs)
    if (stat.isDirectory()) {
      // Try index.html
      const indexHtml = join(abs, "index.html")
      if (existsSync(indexHtml)) {
        const file = await fsp.readFile(indexHtml)
        return new NextResponse(file as any, { headers: { "Content-Type": contentTypeFor(indexHtml) } })
      }

      // Try first html in folder
      const entries = await fsp.readdir(abs)
      const firstHtml = entries.find((f) => f.toLowerCase().endsWith(".html") || f.toLowerCase().endsWith(".htm"))
      if (firstHtml) {
        const file = await fsp.readFile(join(abs, firstHtml))
        return new NextResponse(file as any, { headers: { "Content-Type": contentTypeFor(firstHtml) } })
      }

      // Directory listing fallback
      const listing = entries.map((e) => `<li><a href="${req.nextUrl.pathname.replace(/\/$/, "")}/${e}">${e}</a></li>`).join("")
      return new NextResponse(`<ul>${listing}</ul>`, { headers: { "Content-Type": "text/html; charset=utf-8" } })
    }

    const file = await fsp.readFile(abs)
    return new NextResponse(file as any, { headers: { "Content-Type": contentTypeFor(abs) } })
  } catch (e) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}


