"use client"

import { useSearchParams } from "next/navigation"
import ScormPlayer from "@/components/scorm-player"

export default function ScormViewPage() {
  const searchParams = useSearchParams()
  const entry = searchParams.get("entry") || ""

  if (!entry) {
    return (
      <div className="p-6 text-foreground">
        Thiếu tham số entry. Ví dụ: /scorm/view?entry=/uploads/content/..../course/index.html
      </div>
    )
  }

  return (
    <div className="w-screen h-screen">
      <ScormPlayer entryPoint={entry} className="w-full h-full" />
    </div>
  )
}


