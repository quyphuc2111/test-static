import { ContentItem } from "@/components/content/table"
import { get, isObject } from "lodash"

const getContentUrl = (content: ContentItem) => {
    const desc = content.description
    const scorm = isObject(desc) ? get(desc, 'scorm') : null
    const launchFile = isObject(desc) ? get(desc, 'launchFile') : null
    
    const buildUrl = (launchFile?: string) => {
      const baseUrl = content.contentUrl
      const fullUrl = launchFile ? `${baseUrl}/${launchFile}` : baseUrl
      return fullUrl.replace(/\/+/g, '/')
    }
    
    const needsLaunchFile = content.contentType === 'FILE_ZIP_SCORM' && scorm && launchFile
    const hasLaunchFile = content.contentType === 'FILE_ZIP_HTML' && launchFile
    
    return buildUrl(needsLaunchFile || hasLaunchFile ? launchFile : undefined)
}

const getScormContentUrl = (content: ContentItem) => {
    const url = getContentUrl(content)
    return `/scorm/view?entry=${encodeURIComponent(url)}`
}

export { getContentUrl, getScormContentUrl }