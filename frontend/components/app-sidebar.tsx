"use client"

import * as React from "react"
import { Activity, HeartPulse, LayoutDashboard } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { sourceIcons, sourceLabels, sourceOrder } from "./dashboard/lib/constants"
import type { DashboardSnapshot, DashboardTab } from "./dashboard/lib/types"
import { formatTime } from "./dashboard/lib/utils"
import { StatusDot } from "./dashboard/shared/status-badge"

export function AppSidebar({
  snapshot,
  activeTab,
  onTabChange,
  lastUiRefreshAt,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  snapshot: DashboardSnapshot | null
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  lastUiRefreshAt: string | null
}) {
  const sources = snapshot?.overview.data.sources ?? []
  const { state } = useSidebar()

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Activity className="size-4" />
                </div>
                {state !== "collapsed" && (
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Omni</span>
                    <span className="text-xs text-muted-foreground">
                      Infra control surface
                    </span>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === "overview"}
              onClick={() => onTabChange("overview")}
              tooltip="Overview"
            >
              <LayoutDashboard />
              <span>Overview</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === "health"}
              onClick={() => onTabChange("health")}
              tooltip="Platform Health"
            >
              <HeartPulse />
              <span>Platform Health</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator className="my-2" />
          {sourceOrder.map((source) => {
            const summary = sources.find((item) => item.source === source)
            const Icon = sourceIcons[source]

            return (
              <SidebarMenuItem key={source}>
                <SidebarMenuButton
                  isActive={activeTab === source}
                  onClick={() => onTabChange(source)}
                  tooltip={sourceLabels[source]}
                >
                  <Icon />
                  <span>{sourceLabels[source]}</span>
                  {summary && (
                    <div className="ml-auto flex items-center gap-2">
                      <StatusDot
                        status={summary.status}
                        stale={summary.stale}
                      />
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {state !== "collapsed" && (
          <div className="flex flex-col gap-2 p-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">UI refresh</span>
              <span className="font-mono">
                {lastUiRefreshAt ? formatTime(lastUiRefreshAt) : "--:--:--"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Interval</span>
              <span className="font-mono">15s</span>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
