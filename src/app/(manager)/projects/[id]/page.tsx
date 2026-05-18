import { Suspense } from "react"
import { ProjectDetail } from "@/components/project/project-detail"

export default function ProjectDetailPage() {
  return (
    <Suspense>
      <ProjectDetail />
    </Suspense>
  )
}
