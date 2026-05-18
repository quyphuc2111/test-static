import { useMutation, useQueryClient } from "@tanstack/react-query"
import httpService from "@/services/instance"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

interface UploadContentFilePayload {
  contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
  file: File
}

async function uploadContentFile(
  projectId: string, 
  moduleId: string, 
  contentId: string, 
  payload: UploadContentFilePayload
) {
  // Validate file
  if (!payload.file) {
    throw new Error("Không có file được chọn")
  }
  
  if (payload.file.size === 0) {
    throw new Error("File rỗng")
  }
  
  if (payload.file.size > 1000 * 1024 * 1024) { // 1000MB limit
    throw new Error("File quá lớn (tối đa 1000MB)")
  }
  
  if (!payload.file.name.toLowerCase().endsWith('.zip')) {
    throw new Error("Chỉ chấp nhận file ZIP")
  }

  // CSRF token should be available from httpService automatically
  // No need to call getMe() here as it can cause unnecessary refetches

  const formData = new FormData()
  formData.append("contentType", payload.contentType)
  formData.append("file", payload.file)

  const res = await httpService.post<{ message: string; contentId: string }>({ 
    url: `projects/${projectId}/modules/${moduleId}/content/${contentId}/upload`,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  
  return res
}

export function useUploadContentFile(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contentId, payload }: { contentId: string; payload: UploadContentFilePayload }) =>
      uploadContentFile(projectId, moduleId, contentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.list(projectId, moduleId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.stats(projectId) 
      })
      toast.success("Upload file thành công!")
    },
    onError: (error: any) => {
      console.error("Upload content file error:", error)
      
      let message = "Lỗi khi upload file"
      
      if (error?.response?.status === 500) {
        message = "Lỗi server: " + (error?.response?.data?.error || "Internal Server Error")
      } else if (error?.response?.status === 400) {
        message = "Dữ liệu không hợp lệ: " + (error?.response?.data?.error || "Bad Request")
      } else if (error?.response?.status === 401) {
        message = "Không có quyền truy cập"
      } else if (error?.response?.status === 403) {
        message = "Bị cấm truy cập"
      } else if (error?.response?.status === 404) {
        message = "Không tìm thấy tài liệu"
      } else if (error?.message) {
        message = error.message
      }
      
      toast.error(message)
    }
  })
}
