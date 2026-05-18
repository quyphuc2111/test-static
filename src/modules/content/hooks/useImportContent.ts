import { useMutation, useQueryClient } from "@tanstack/react-query"
import { importContentBulk } from "../content.service"

export function useImportContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: Array<{ title: string; description?: any; contentType?: 'FILE_ZIP_HTML' | 'FILE_ZIP_SCORM' }>) =>
      importContentBulk(projectId, moduleId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "modules"] })
      queryClient.invalidateQueries({ queryKey: ["content", projectId, moduleId] })
    }
  })
}



