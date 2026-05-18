"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createProject, deleteProject, listProjects, updateProject } from "../project.service"
import cachedKeys from "@/constants/cachedKeys"
import { CreateProjectPayload, UpdateProjectPayload, ListProjectsParams } from "../project.interface"

export function useProjects(params?: ListProjectsParams) {
  const qc = useQueryClient()
  
  const queryKey = cachedKeys.project.list(params)

  const listQuery = useQuery({ 
    queryKey, 
    queryFn: () => listProjects(params)
  })

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", "list"] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateProjectPayload) => 
      updateProject(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", "list"] }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", "list"] }),
  })

  return {
    projects: listQuery.data,
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    createProject: createMut.mutateAsync,
    updateProject: (id: string, payload: UpdateProjectPayload) => 
      updateMut.mutateAsync({ id, ...payload }),
    deleteProject: deleteMut.mutateAsync,
  }
}


