"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SCORMInfo } from "./scorm-info"

interface SCORMInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: {
    title: string
    description?: any
  } | null
  scormData: any
}

export function SCORMInfoDialog({ 
  open, 
  onOpenChange, 
  content, 
  scormData 
}: SCORMInfoDialogProps) {
  if (!content || !scormData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thông tin SCORM - {content.title}</DialogTitle>
        </DialogHeader>
        <SCORMInfo scormData={scormData} />
      </DialogContent>
    </Dialog>
  )
}
