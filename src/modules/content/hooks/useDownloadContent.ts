import { useMutation } from "@tanstack/react-query"
import { downloadContent } from "../content.service"
import { toast } from "react-toastify"

export function useDownloadContent(projectId: string, moduleId: string) {
  return useMutation({
    mutationFn: (contentId: string) => downloadContent(projectId, moduleId, contentId),
    onSuccess: (result: any, contentId: string) => {
      try {
        const { blob, filename } = result
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename // Use filename from server
        link.style.display = 'none'
        
        // Add to DOM, click, and remove
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 1000)
        
      } catch (error) {
        console.error('Error creating download link:', error)
      }
    },
    onError: (error: any) => {
      console.error('Download failed:', error)
      toast.error(`Tải xuống thất bại: ${error.message || 'Lỗi không xác định'}`)
    }
  })
}
