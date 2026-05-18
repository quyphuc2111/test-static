"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectSharing } from "./project-sharing"
import { ModuleSharing } from "./module-sharing"
import { UserContentSharing } from "./user-content-sharing"
import { SharingHistory } from "./sharing-history"

export function ContentSharingManager() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Chia sẻ Nội dung
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Quản lý chia sẻ nội dung theo dự án, module và người dùng
        </p>
      </div>

      <Tabs defaultValue="project" className="space-y-4 md:space-y-6">
        {/* Tabs List với scroll horizontal trên mobile */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="bg-muted/50 inline-flex w-full sm:w-auto min-w-full sm:min-w-0 h-auto p-1">
              <TabsTrigger 
                value="project" 
                className="flex-1 sm:flex-none whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 gap-1"
              >
                <span className="hidden sm:inline">Chia sẻ theo </span>Dự án
              </TabsTrigger>
              <TabsTrigger 
                value="module" 
                className="flex-1 sm:flex-none whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 gap-1"
              >
                <span className="hidden sm:inline">Chia sẻ theo </span>Module
              </TabsTrigger>
              <TabsTrigger 
                value="user" 
                className="flex-1 sm:flex-none whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 gap-1"
              >
                <span className="hidden sm:inline">Chia sẻ giữa </span>Users
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex-1 sm:flex-none whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 gap-1"
              >
                Lịch sử<span className="hidden sm:inline"> Chia sẻ</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="project" className="space-y-4">
          <ProjectSharing />
        </TabsContent>

        <TabsContent value="module" className="space-y-4">
          <ModuleSharing />
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <UserContentSharing />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <SharingHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
