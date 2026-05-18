import httpService from "@/services/instance"
import { CONTENT_API_URL } from "@/constants/apiUrl"
import { ContentData, CreateContentPayload, UpdateContentPayload, ContentStats } from "./content.interface"

export async function listContent(projectId: string, moduleId: string) {
  const res = await httpService.get<{ data: ContentData[] }>({
    url: CONTENT_API_URL.ROOT(projectId, moduleId)
  })
  return res.data
}

export async function createContent(
  projectId: string,
  moduleId: string,
  payload: CreateContentPayload,
  onUploadProgress?: (progress: number) => void
) {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('contentType', payload.contentType)
  if (payload.description) {
    formData.append('description', payload.description)
  }
  formData.append('file', payload.file)

  const res = await httpService.post<{ data: ContentData }>({
    url: CONTENT_API_URL.ROOT(projectId, moduleId),
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onUploadProgress
      ? (progressEvent: any) => {
        const percent = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0
        onUploadProgress(percent)
      }
      : undefined,
  })
  return res.data
}

export async function updateContent(projectId: string, moduleId: string, contentId: string, payload: UpdateContentPayload) {
  const res = await httpService.patch<{ data: ContentData }>({
    url: CONTENT_API_URL.BY_ID(projectId, moduleId, contentId),
    data: payload
  })
  return res.data
}

export async function deleteContent(projectId: string, moduleId: string, contentId: string) {
  return httpService.delete<{ message: string }>({
    url: CONTENT_API_URL.BY_ID(projectId, moduleId, contentId)
  })
}

export async function restoreContent(projectId: string, moduleId: string, contentId: string) {
  return httpService.post<{ message: string; data: ContentData }>({
    url: `${CONTENT_API_URL.BY_ID(projectId, moduleId, contentId)}/restore`
  })
}

export async function bulkDeleteContent(projectId: string, moduleId: string, contentIds: string[]) {
  return httpService.post<{ message: string; deletedCount: number }>({
    url: CONTENT_API_URL.BULK_DELETE(projectId, moduleId),
    data: { contentIds }
  })
}

export async function downloadContent(projectId: string, moduleId: string, contentId: string) {
  try {
    const downloadUrl = CONTENT_API_URL.DOWNLOAD(projectId, moduleId, contentId)
    const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}/api/${downloadUrl}`
    console.log('Download URL:', downloadUrl)
    console.log('Full URL:', fullUrl)
    console.log('Project ID:', projectId, 'Module ID:', moduleId, 'Content ID:', contentId)

    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('Error data:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()

    // Try to get filename from Content-Disposition header
    let filename = 'download.zip'
    const contentDisposition = response.headers.get('content-disposition')
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/)
      if (match && match[1]) {
        filename = match[1]
      }
    }

    return { blob, filename }
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

export async function getContentStats(projectId?: string) {
  const res = await httpService.get<{ data: ContentStats }>({
    url: CONTENT_API_URL.STATS(projectId)
  })
  return res.data
}

export async function softDeleteContent(projectId: string, moduleId: string, contentId: string) {
  return httpService.post<{ message: string }>({
    url: CONTENT_API_URL.SOFT_DELETE(projectId, moduleId, contentId)
  })
}

export async function hardDeleteContent(projectId: string, moduleId: string, contentId: string) {
  return httpService.delete<{ message: string }>({
    url: CONTENT_API_URL.HARD_DELETE(projectId, moduleId, contentId)
  })
}

export async function importContentBulk(projectId: string, moduleId: string, items: Array<{ title: string; description?: any; contentType?: 'FILE_ZIP_HTML' | 'FILE_ZIP_SCORM' }>) {
  return httpService.post<{ message: string; importedCount: number }>({
    url: CONTENT_API_URL.IMPORT(projectId, moduleId),
    data: { items }
  })
}
