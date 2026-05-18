"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog"

interface JsonModalProps {
  children: React.ReactNode
  title: string
  jsonData: any
}

export function JsonModal({ children, title, jsonData }: JsonModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  let formattedJson = "{}"
  try {
    formattedJson = typeof jsonData === "string"
      ? JSON.stringify(JSON.parse(jsonData), null, 2)
      : JSON.stringify(jsonData, null, 2)
  } catch {
    formattedJson = String(jsonData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer w-full min-w-0">
        {children}
      </div>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col cursor-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Metadata mô tả cho gói nội dung này.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-xl shadow-inner mt-2">
          <pre className="text-xs text-green-400 font-mono whitespace-pre w-full">
            {formattedJson}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
