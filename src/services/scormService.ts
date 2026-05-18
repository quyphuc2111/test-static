import { readFile, readdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { parseString } from "xml2js"

export interface SCORMManifest {
  identifier: string
  title: string
  version: string
  organizations: SCORMOrganization[]
  resources: SCORMResource[]
  metadata?: SCORMMetadata
}

export interface SCORMOrganization {
  identifier: string
  title: string
  items: SCORMItem[]
}

export interface SCORMItem {
  identifier: string
  title: string
  identifierref?: string
  parameters?: string
  items?: SCORMItem[]
}

export interface SCORMResource {
  identifier: string
  type: string
  href: string
  base?: string
  files?: SCORMFile[]
}

export interface SCORMFile {
  href: string
}

export interface SCORMMetadata {
  schema: string
  schemaversion: string
  lom?: any
}

export class SCORMService {
  /**
   * Parse SCORM manifest file (imsmanifest.xml)
   */
  static async parseManifest(extractPath: string): Promise<SCORMManifest | null> {
    try {
      const manifestPath = join(extractPath, 'imsmanifest.xml')
      
      if (!existsSync(manifestPath)) {
        console.log('No imsmanifest.xml found, checking for alternative locations...')
        
        // Check subdirectories for imsmanifest.xml
        const subdirs = await this.findManifestInSubdirs(extractPath)
        if (subdirs.length > 0) {
          const subdirManifest = await this.parseManifest(subdirs[0])
          return subdirManifest
        }
        
        return null
      }

      const manifestContent = await readFile(manifestPath, 'utf-8')
      return await this.parseXMLManifest(manifestContent)
    } catch (error) {
      console.error('Error parsing SCORM manifest:', error)
      return null
    }
  }

  /**
   * Find imsmanifest.xml in subdirectories
   */
  private static async findManifestInSubdirs(dir: string): Promise<string[]> {
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      const manifestPaths: string[] = []

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subdirPath = join(dir, entry.name)
          const manifestPath = join(subdirPath, 'imsmanifest.xml')
          
          if (existsSync(manifestPath)) {
            manifestPaths.push(subdirPath)
          }
          
          // Recursively search subdirectories
          const subdirManifests = await this.findManifestInSubdirs(subdirPath)
          manifestPaths.push(...subdirManifests)
        }
      }

      return manifestPaths
    } catch (error) {
      console.error('Error searching for manifest in subdirectories:', error)
      return []
    }
  }

  /**
   * Parse XML manifest content using xml2js
   */
  private static async parseXMLManifest(xmlContent: string): Promise<SCORMManifest> {
    return new Promise((resolve, reject) => {
      parseString(xmlContent, { 
        explicitArray: false,
        mergeAttrs: true,
        trim: true
      }, (err, result) => {
        if (err) {
          reject(err)
          return
        }

        try {
          console.log('Parsed manifest structure:', JSON.stringify(result.manifest, null, 2))
          
          const manifest: SCORMManifest = {
            identifier: result.manifest?.identifier || 'unknown',
            title: this.extractTitle(result.manifest) || 'Untitled',
            version: result.manifest?.version || '1.0',
            organizations: [],
            resources: []
          }

          // Parse organizations
          if (result.manifest?.organizations?.organization) {
            const orgs = Array.isArray(result.manifest.organizations.organization) 
              ? result.manifest.organizations.organization 
              : [result.manifest.organizations.organization]

            for (const org of orgs) {
              const organization: SCORMOrganization = {
                identifier: org.identifier || 'org1',
                title: org.title || 'Organization',
                items: this.parseItemsFromXML(org.item || [])
              }
              manifest.organizations.push(organization)
            }
          }

          // Parse resources
          if (result.manifest?.resources?.resource) {
            const resources = Array.isArray(result.manifest.resources.resource)
              ? result.manifest.resources.resource
              : [result.manifest.resources.resource]

            for (const res of resources) {
              const resource: SCORMResource = {
                identifier: res.identifier || 'res1',
                type: res.type || 'webcontent',
                href: res.href || 'index.html',
                base: res.base,
                files: this.parseFilesFromXML(res.file || [])
              }
              manifest.resources.push(resource)
            }
          }

          resolve(manifest)
        } catch (parseError) {
          reject(parseError)
        }
      })
    })
  }

  /**
   * Parse items from XML object
   */
  private static parseItemsFromXML(items: any[]): SCORMItem[] {
    if (!Array.isArray(items)) {
      items = items ? [items] : []
    }

    return items.map(item => ({
      identifier: item.identifier || 'item1',
      title: item.title || 'Item',
      identifierref: item.identifierref || undefined,
      parameters: item.parameters || undefined,
      items: item.item ? this.parseItemsFromXML(Array.isArray(item.item) ? item.item : [item.item]) : []
    }))
  }

  /**
   * Parse files from XML object
   */
  private static parseFilesFromXML(files: any[]): SCORMFile[] {
    if (!Array.isArray(files)) {
      files = files ? [files] : []
    }

    return files.map(file => ({
      href: file.href || ''
    }))
  }


  /**
   * Validate SCORM package structure
   */
  static async validateSCORMPackage(extractPath: string): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    manifest?: SCORMManifest
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Check for manifest
      const manifest = await this.parseManifest(extractPath)
      if (!manifest) {
        errors.push('No imsmanifest.xml found')
        return { isValid: false, errors, warnings }
      }

      // Validate manifest structure
      if (!manifest.identifier) {
        errors.push('Manifest missing identifier')
      }

      if (!manifest.title) {
        warnings.push('Manifest missing title')
      }

      if (manifest.organizations.length === 0) {
        errors.push('No organizations found in manifest')
      }

      if (manifest.resources.length === 0) {
        errors.push('No resources found in manifest')
      }

      // Check for launch file
      const hasLaunchFile = manifest.resources.some(resource => 
        resource.href && (resource.href.endsWith('.html') || resource.href.endsWith('.htm'))
      )

      if (!hasLaunchFile) {
        warnings.push('No HTML launch file found in resources')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        manifest
      }
    } catch (error) {
      errors.push(`Error validating SCORM package: ${error}`)
      return { isValid: false, errors, warnings }
    }
  }

  /**
   * Extract title from manifest
   */
  private static extractTitle(manifest: any): string | null {
    // Try different title locations
    if (manifest?.metadata?.lom?.general?.title?.langstring?._) {
      return manifest.metadata.lom.general.title.langstring._
    }
    
    if (manifest?.metadata?.lom?.general?.title?.langstring) {
      return typeof manifest.metadata.lom.general.title.langstring === 'string' 
        ? manifest.metadata.lom.general.title.langstring 
        : manifest.metadata.lom.general.title.langstring._
    }
    
    if (manifest?.metadata?.lom?.general?.title?.string) {
      return manifest.metadata.lom.general.title.string
    }
    
    if (manifest?.metadata?.lom?.general?.title) {
      return typeof manifest.metadata.lom.general.title === 'string' 
        ? manifest.metadata.lom.general.title 
        : manifest.metadata.lom.general.title.string
    }
    
    if (manifest?.metadata?.title) {
      return manifest.metadata.title
    }
    
    if (manifest?.title) {
      return manifest.title
    }
    
    return null
  }

  /**
   * Detect SCORM version from manifest XML content
   */
  static detectSCORMVersion(manifestPath: string): '1.2' | '2004' | 'unknown' {
    try {
      const fs = require('fs')
      const xmlContent = fs.readFileSync(manifestPath, 'utf-8')
      
      // Check namespace from root element
      const rootNamespaceMatch = xmlContent.match(/<manifest[^>]*xmlns[^>]*>/i)
      if (rootNamespaceMatch) {
        const rootElement = rootNamespaceMatch[0]
        
        // SCORM 2004 namespace
        if (rootElement.includes('http://www.imsglobal.org/xsd/imscp_v1p1')) {
          // Check schemaversion for confirmation
          const schemaVersionMatch = xmlContent.match(/<schemaversion[^>]*>([^<]+)<\/schemaversion>/i)
          if (schemaVersionMatch) {
            const versionText = schemaVersionMatch[1].toLowerCase()
            if (versionText.includes('2004') || versionText.includes('cam 1.3')) {
              return '2004'
            }
          }
          return '2004' // Default for this namespace
        }
        
        // SCORM 1.2 namespace
        if (rootElement.includes('http://www.imsproject.org/xsd/imscp_rootv1p1p2')) {
          return '1.2'
        }
      }

      // Fallback - check schemaversion without namespace
      const schemaVersionMatch = xmlContent.match(/<schemaversion[^>]*>([^<]+)<\/schemaversion>/i)
      if (schemaVersionMatch) {
        const versionText = schemaVersionMatch[1].toLowerCase()
        if (versionText.includes('2004') || versionText.includes('cam') || versionText.includes('3rd edition')) {
          return '2004'
        }
        if (versionText.includes('1.2')) {
          return '1.2'
        }
      }

      // Check scormType vs scormtype attributes
      const scormTypeMatch = xmlContent.match(/adlcp:scormType/i)
      if (scormTypeMatch) {
        return '2004' // SCORM 2004 uses "scormType"
      }
      
      const scormtypeMatch = xmlContent.match(/adlcp:scormtype/i)
      if (scormtypeMatch) {
        return '1.2' // SCORM 1.2 uses "scormtype"
      }

      return 'unknown'
    } catch (error) {
      console.error('Error detecting SCORM version:', error)
      return 'unknown'
    }
  }

  /**
   * Get SCORM version from manifest
   */
  static getSCORMVersion(manifest: SCORMManifest): '1.2' | '2004' | 'unknown' {
    // Check metadata for SCORM version
    if (manifest.metadata?.schema) {
      const schema = manifest.metadata.schema.toLowerCase()
      if (schema.includes('1.2') || schema.includes('scorm 1.2')) return '1.2'
      if (schema.includes('2004') || schema.includes('scorm 2004')) return '2004'
    }

    // Check schemaversion (most reliable)
    if (manifest.metadata?.schemaversion) {
      const schemaVersion = manifest.metadata.schemaversion.toLowerCase()
      if (schemaVersion.includes('1.2')) return '1.2'
      if (schemaVersion.includes('2004')) return '2004'
    }

    // Check metametadata
    if (manifest.metadata?.lom?.metametadata?.metadatascheme) {
      const metaScheme = manifest.metadata.lom.metametadata.metadatascheme.toLowerCase()
      if (metaScheme.includes('1.2')) return '1.2'
      if (metaScheme.includes('2004')) return '2004'
    }

    // Check manifest version
    if (manifest.version) {
      const version = manifest.version.toLowerCase()
      if (version.includes('1.2')) return '1.2'
      if (version.includes('2004')) return '2004'
    }

    return 'unknown'
  }

  /**
   * Find launch file from manifest using SCORM-specific logic
   */
  static findLaunchFile(manifest: SCORMManifest, extractPath: string): string | null {
    try {
      const fs = require('fs')
      const path = require('path')
      
      // Find manifest file to get raw XML
      const manifestPath = join(extractPath, 'imsmanifest.xml')
      if (!existsSync(manifestPath)) {
        return this.findHTMLFileFallback(extractPath)
      }

      const xmlContent = fs.readFileSync(manifestPath, 'utf-8')
      
      // Detect SCORM version
      const scormVersion = this.detectSCORMVersion(manifestPath)
      
      if (scormVersion === '1.2') {
        return this.handleSCORM12(xmlContent, extractPath)
      } else if (scormVersion === '2004') {
        return this.handleSCORM2004(xmlContent, extractPath)
      } else {
        // Fallback to simple resource lookup
        return this.findLaunchFileFromResources(manifest, extractPath)
      }
    } catch (error) {
      console.error('Error finding launch file:', error)
      return this.findHTMLFileFallback(extractPath)
    }
  }

  /**
   * Handle SCORM 1.2 launch file detection
   */
  private static handleSCORM12(xmlContent: string, extractPath: string): string | null {
    try {
      // Find default organization
      const defaultOrgMatch = xmlContent.match(/<organizations[^>]*default=["']([^"']+)["'][^>]*>/i)
      const defaultOrgId = defaultOrgMatch ? defaultOrgMatch[1] : null
      
      // Find organization element
      let orgMatch: RegExpMatchArray | null = null
      if (defaultOrgId) {
        orgMatch = xmlContent.match(new RegExp(`<organization[^>]*identifier=["']${defaultOrgId}["'][^>]*>([\\s\\S]*?)</organization>`, 'i'))
      }
      
      if (!orgMatch) {
        // Fallback: get first organization
        orgMatch = xmlContent.match(/<organization[^>]*>([\s\S]*?)<\/organization>/i)
      }
      
      if (!orgMatch) {
        throw new Error('No organization found in SCORM 1.2')
      }
      
      const orgContent = orgMatch[1]
      
      // Find first item with identifierref
      const itemMatch = orgContent.match(/<item[^>]*identifierref=["']([^"']+)["'][^>]*>/i)
      if (!itemMatch) {
        throw new Error('No item with identifierref found in SCORM 1.2')
      }
      
      const resourceId = itemMatch[1]
      
      // Find resource with this identifier
      const resourceMatch = xmlContent.match(new RegExp(`<resource[^>]*identifier=["']${resourceId}["'][^>]*>([\\s\\S]*?)</resource>`, 'i'))
      if (!resourceMatch) {
        throw new Error(`Resource with ID ${resourceId} not found`)
      }
      
      const resourceContent = resourceMatch[1]
      
      // Get href from resource
      const hrefMatch = resourceContent.match(/href=["']([^"']+)["']/i)
      if (!hrefMatch) {
        throw new Error(`Resource ${resourceId} has no href attribute`)
      }
      
      let href = hrefMatch[1]
      
      // Combine with extract path
      const fullPath = join(extractPath, href.replace(/\//g, require('path').sep))
      
      // For SCORM 1.2, add ?type=scorm if no query string
      if (!href.includes('?')) {
        return href + '?type=scorm'
      }
      
      return href
    } catch (error) {
      console.error('Error handling SCORM 1.2:', error)
      return this.findHTMLFileFallback(extractPath)
    }
  }

  /**
   * Handle SCORM 2004 launch file detection
   */
  private static handleSCORM2004(xmlContent: string, extractPath: string): string | null {
    try {
      // Find default organization
      const defaultOrgMatch = xmlContent.match(/<organizations[^>]*default=["']([^"']+)["'][^>]*>/i)
      const defaultOrgId = defaultOrgMatch ? defaultOrgMatch[1] : null
      
      // Find organization element
      let orgMatch: RegExpMatchArray | null = null
      if (defaultOrgId) {
        orgMatch = xmlContent.match(new RegExp(`<organization[^>]*identifier=["']${defaultOrgId}["'][^>]*>([\\s\\S]*?)</organization>`, 'i'))
      }
      
      if (!orgMatch) {
        // Fallback: get first organization
        orgMatch = xmlContent.match(/<organization[^>]*>([\s\S]*?)<\/organization>/i)
      }
      
      if (!orgMatch) {
        throw new Error('No organization found in SCORM 2004')
      }
      
      const orgContent = orgMatch[1]
      
      // Find first visible item with identifierref (prioritize visible items)
      let itemMatch = orgContent.match(/<item[^>]*identifierref=["']([^"']+)["'][^>]*(?:isvisible=["']true["']|(?!isvisible=["']false["']))[^>]*>/i)
      
      if (!itemMatch) {
        // Fallback: any item with identifierref
        itemMatch = orgContent.match(/<item[^>]*identifierref=["']([^"']+)["'][^>]*>/i)
      }
      
      if (!itemMatch) {
        throw new Error('No item with identifierref found in SCORM 2004')
      }
      
      const resourceId = itemMatch[1]
      
      // Find resource with this identifier
      const resourceMatch = xmlContent.match(new RegExp(`<resource[^>]*identifier=["']${resourceId}["'][^>]*>([\\s\\S]*?)</resource>`, 'i'))
      if (!resourceMatch) {
        throw new Error(`Resource with ID ${resourceId} not found`)
      }
      
      const resourceContent = resourceMatch[1]
      
      // Get href from resource
      const hrefMatch = resourceContent.match(/href=["']([^"']+)["']/i)
      if (!hrefMatch) {
        throw new Error(`Resource ${resourceId} has no href attribute`)
      }
      
      const href = hrefMatch[1]
      
      // Combine with extract path
      const fullPath = join(extractPath, href.replace(/\//g, require('path').sep))
      
      return href
    } catch (error) {
      console.error('Error handling SCORM 2004:', error)
      return this.findHTMLFileFallback(extractPath)
    }
  }

  /**
   * Find launch file from parsed resources (fallback)
   */
  private static findLaunchFileFromResources(manifest: SCORMManifest, extractPath: string): string | null {
    // Look for the first HTML file in resources
    for (const resource of manifest.resources) {
      // Check main href - remove query parameters
      if (resource.href) {
        const cleanHref = resource.href.split('?')[0] // Remove query params
        if (cleanHref.endsWith('.html') || cleanHref.endsWith('.htm')) {
          const launchPath = join(extractPath, cleanHref)
          if (existsSync(launchPath)) {
            return cleanHref
          }
        }
      }

      // Check files in resource
      if (resource.files) {
        for (const file of resource.files) {
          if (file.href && (file.href.endsWith('.html') || file.href.endsWith('.htm'))) {
            const launchPath = join(extractPath, file.href)
            if (existsSync(launchPath)) {
              return file.href
            }
          }
        }
      }
    }

    return this.findHTMLFileFallback(extractPath)
  }

  /**
   * Fallback: look for any HTML file in the directory
   */
  private static findHTMLFileFallback(extractPath: string): string | null {
    try {
      const fs = require('fs')
      
      const findHTMLFile = (dir: string): string | null => {
        const files = fs.readdirSync(dir)
        
        // Look for index files first
        const indexFiles = files.filter((file: string) => 
          file.toLowerCase() === 'index.html' || 
          file.toLowerCase() === 'index.htm'
        )
        
        if (indexFiles.length > 0) {
          return indexFiles[0]
        }
        
        // Look for any HTML file
        const htmlFiles = files.filter((file: string) => 
          file.toLowerCase().endsWith('.html') || 
          file.toLowerCase().endsWith('.htm')
        )
        
        if (htmlFiles.length > 0) {
          return htmlFiles[0]
        }
        
        return null
      }
      
      return findHTMLFile(extractPath)
    } catch (error) {
      console.error('Error finding HTML file:', error)
      return null
    }
  }
}
