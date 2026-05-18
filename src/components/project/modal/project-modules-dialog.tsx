"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useModules } from "@/modules/project/hooks/useModules"
import { useCreateModule } from "@/modules/project/hooks/useCreateModule"
import { useUpdateModule } from "@/modules/project/hooks/useUpdateModule"

type Props = { projectId: string; count: number }

export function ProjectModulesDialog({ projectId, count }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const listQuery = useModules(projectId, open)
  const createMut = useCreateModule()
  const updateMut = useUpdateModule()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto">{count}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modules ({count})</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Tên module" value={name} onChange={(e) => setName(e.target.value)} />
            <Button 
              onClick={() => {
                if (name.trim()) {
                  createMut.mutate({
                    projectId: projectId,
                    name: name.trim()
                  })
                  setName("")
                }
              }} 
              disabled={!name.trim()}
            >
              Tạo
            </Button>
          </div>
          {listQuery.isLoading ? (
            <p>Đang tải...</p>
          ) : (
            <ScrollArea className="h-64 pr-2">
              <div className="space-y-2">
                {listQuery.data?.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    {editingId === m.id ? (
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => {
                          const next = editingName.trim()
                          if (next && next !== m.name) {
                            updateMut.mutate({ 
                              projectId: projectId,
                              moduleId: m.id, 
                              name: next 
                            })
                          } else {
                            setEditingId(null)
                            setEditingName("")
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const next = editingName.trim()
                            if (next && next !== m.name) {
                              updateMut.mutate({ 
                                projectId: projectId,
                                moduleId: m.id, 
                                name: next 
                              })
                            }
                          }
                          if (e.key === "Escape") {
                            setEditingId(null)
                            setEditingName("")
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="px-2 py-1 rounded border bg-card text-sm flex-1 cursor-text"
                        onClick={() => {
                          setEditingId(m.id)
                          setEditingName(m.name)
                        }}
                        title="Nhấn để sửa nhanh"
                      >
                        {m.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


