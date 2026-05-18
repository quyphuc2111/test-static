"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Shield, Users, Lock, Crown, Star, Briefcase, Zap, Award, Target, Gem, Heart, Hash, Search, ChevronRight, Check, Loader2, ChevronRight as SwipeIcon } from "lucide-react"
import { useRoles, usePermissions } from "@/modules/rbac/hooks"

export function PermissionsMatrix() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [canScroll, setCanScroll] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissions, isLoading: permissionsLoading } = usePermissions()

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Check if table can scroll
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current
        const canScrollNow = scrollWidth > clientWidth
        setCanScroll(canScrollNow)
      }
    }

    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [roles])

  // Hide hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollHint(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleScroll = () => {
    setShowScrollHint(false)
  }


  // Color palette for roles
  const colorPalette = [
    { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
    { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-600' },
    { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-600' },
    { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
    { border: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-600' },
    { border: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-600' },
  ]

  // Icon palette for roles
  const iconPalette = [Shield, Crown, Star, Briefcase, Users, Zap, Award, Target, Gem, Heart, Lock]

  const getRoleColor = (roleId: number) => {
    return colorPalette[roleId % colorPalette.length]
  }

  const getRoleIcon = (roleId: number) => {
    return iconPalette[roleId % iconPalette.length]
  }

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {
      "Content Management": permissions?.filter(p => p.name.includes("CONTENT") || p.name.includes("SHARE")) || [],
      "Project/Module Management": permissions?.filter(p => p.name.includes("PROJECT") || p.name.includes("MODULE")) || [],
      "User Management": permissions?.filter(p => p.name.includes("USER")) || [],
      "Audit & Dashboard": permissions?.filter(p => p.name.includes("AUDIT") || p.name.includes("DASHBOARD")) || []
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      const filtered: Record<string, any[]> = {}
      Object.entries(groups).forEach(([key, perms]) => {
        const filteredPerms = perms.filter(p => 
          p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (p.description || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
        if (filteredPerms.length > 0) {
          filtered[key] = filteredPerms
        }
      })
      return filtered
    }

    return groups
  }, [permissions, debouncedSearchTerm])

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <div className="space-y-3">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-2 flex-1 max-w-sm">
          <label className="text-sm font-medium text-foreground">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Tìm kiếm quyền..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full h-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-600 pb-2">
          <span>{Object.keys(groupedPermissions).length} nhóm</span>
          <span>•</span>
          <span>{roles?.length || 0} vai trò</span>
        </div>
      </div>

      {/* Scroll Hint for Mobile */}
      {canScroll && showScrollHint && (
        <div className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
          <SwipeIcon className="h-4 w-4" />
          <span>Vuốt để xem thêm</span>
          <SwipeIcon className="h-4 w-4" />
        </div>
      )}

      {/* Matrix Table */}
      <div className="border border-gray-200 rounded bg-white w-[calc(100vw-2rem)] md:w-full">
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-x-auto table-scroll-container" 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}>
          <style jsx>{`
            div::-webkit-scrollbar {
              height: 8px;
            }
            div::-webkit-scrollbar-track {
              background: #f3f4f6;
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb {
              background: #d1d5db;
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: #9ca3af;
            }
          `}</style>
          {(rolesLoading || permissionsLoading) ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-600">Đang tải ma trận quyền hạn...</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm" style={{ tableLayout: 'auto', minWidth: 'max-content' }}>
              <colgroup>
                <col style={{ width: '300px', minWidth: '250px' }} />
                {roles?.map((role) => (
                  <col key={role.id} style={{ width: '120px', minWidth: '100px' }} />
                ))}
              </colgroup>
              <thead className="bg-gray-50 sticky top-0 z-10 border-b-2 border-gray-200">
                <tr>
                  <th className="md:sticky left-0 z-20 bg-gray-50 px-3 sm:px-5 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide border-r border-gray-200">
                    Quyền hạn
                  </th>
                  {roles?.map((role, index) => {
                    const roleColor = getRoleColor(index)
                    const RoleIcon = getRoleIcon(index)
                    
                    return (
                      <th key={role.id} className="px-1 py-3 text-center border-l border-gray-200">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`${roleColor.bg} ${roleColor.border} ${roleColor.text} border px-1.5 py-1 rounded-lg w-full flex items-center justify-center gap-1`}>
                            <RoleIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="font-semibold text-[10px] truncate">{role.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-0.5 w-full justify-center h-5">
                            <Badge className={`${roleColor.bg} ${roleColor.text} text-[9px] px-1 py-0.5 border-0 flex items-center gap-0.5 font-semibold`}>
                              <Hash className="h-2 w-2" />
                              <span>{role.permissions?.length || 0}</span>
                            </Badge>
                          </div>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="bg-white">
                {Object.entries(groupedPermissions).map(([groupName, groupPermissions]) => {
                  const isExpanded = expandedGroups.has(groupName)
                  
                  return (
                    <React.Fragment key={groupName}>
                      <tr className="border-t border-gray-200">
                        <td 
                          colSpan={(roles?.length || 0) + 1} 
                          className="sticky left-0 z-10 bg-white px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => toggleGroup(groupName)}
                        >
                          <div className="flex items-center gap-2 h-6">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <ChevronRight 
                                className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                              />
                            </div>
                            <span className="font-semibold text-xs text-gray-900">{groupName}</span>
                            <span className="text-xs text-gray-500">
                              ({groupPermissions.length})
                            </span>
                          </div>
                        </td>
                      </tr>
                      
                      <tr>
                        <td colSpan={(roles?.length || 0) + 1} className="p-0">
                          <div 
                            className="overflow-hidden transition-all duration-300 ease-in-out"
                            style={{ 
                              maxHeight: isExpanded ? `${groupPermissions.length * 80}px` : '0px'
                            }}
                          >
                            <table className="w-full">
                              <tbody>
                                {groupPermissions.map((permission, idx) => (
                                  <tr 
                                    key={permission.id} 
                                    className={`hover:bg-blue-50/50 transition-colors border-b border-gray-200 ${idx === 0 ? 'border-t border-gray-200' : ''}`}
                                  >
                                    <td className="px-3 py-2.5 border-r border-gray-200" style={{ width: '300px', minWidth: '250px' }}>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-900 font-medium">
                                          {permission.nameVi || permission.name}
                                        </span>
                                        <code className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded w-fit font-mono">
                                          {permission.name}
                                        </code>
                                      </div>
                                    </td>
                                    {roles?.map((role) => {
                                      const hasPermission = role.permissions?.some(
                                        rp => rp.permissionId === permission.id
                                      )
                                      return (
                                        <td key={role.id} className="px-2 py-2.5 text-center border-l border-gray-200" style={{ width: '120px', minWidth: '100px' }}>
                                          {hasPermission ? (
                                            <div className="flex justify-center">
                                              <div className="bg-blue-500 rounded-full p-0.5">
                                                <Check className="h-3 w-3 text-white" />
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex justify-center">
                                              <span className="text-gray-200">—</span>
                                            </div>
                                          )}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded">
        <div className="flex items-center gap-1.5">
          <div className="bg-blue-500 rounded-full p-0.5">
            <Check className="h-2.5 w-2.5 text-white" />
          </div>
          <span>Có quyền</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-200">—</span>
          <span>Không có</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <ChevronRight className="h-3 w-3" />
          <span>Nhấp vào nhóm để mở/đóng</span>
        </div>
      </div>
    </div>
  )
}
