import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { createUser, deleteUser, getUsers, updateUser, toggleUserStatus, resetUserPassword } from "../rbac.service"
import { CreateUserPayload, UpdateUserPayload } from "../rbac.interface"

export function useUsers(params?: { page?: number; pageSize?: number; search?: string }) {
  const qc = useQueryClient()

  const list = useQuery({
    queryKey: ["rbac", "users", params?.page ?? 1, params?.pageSize ?? 10, params?.search ?? ""],
    queryFn: () => getUsers(params)
  })

  const create = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateUserPayload) => updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const remove = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const toggleStatus = useMutation({
    mutationFn: (userId: number) => toggleUserStatus(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const resetPassword = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: number; newPassword: string }) => 
      resetUserPassword(userId, newPassword),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  return { ...list, create, update, remove, toggleStatus, resetPassword }
}
