import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getRoles, createRole, updateRole, deleteRole, cloneRole, toggleRoleStatus } from "../rbac.service"
import { CreateRolePayload } from "../rbac.interface"
import cachedKeys from "@/constants/cachedKeys"

export function useRoles() {
  return useQuery({
    queryKey: cachedKeys.rbac.roles,
    queryFn: getRoles,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.rbac.roles })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number; payload: Partial<CreateRolePayload> }) => 
      updateRole(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.rbac.roles })
    },
  })
}

export function useCloneRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roleId: number) => cloneRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.rbac.roles })
    },
  })
}

export function useToggleRoleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roleId: number) => toggleRoleStatus(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.rbac.roles })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roleId: number) => deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.rbac.roles })
    },
  })
}
