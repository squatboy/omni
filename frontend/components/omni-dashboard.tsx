"use client"

import * as React from "react"
import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import {
  POLL_INTERVAL_MS,
  sourceLabels,
} from "./dashboard/lib/constants"
import type { DashboardSnapshot, DashboardTab } from "./dashboard/lib/types"
import { formatDateTime, loadSnapshot } from "./dashboard/lib/utils"
import { HealthBadge } from "./dashboard/shared/common"
import { DashboardContent } from "./dashboard/shared/dashboard-content"
import { DashboardSkeleton } from "./dashboard/shared/dashboard-skeleton"

export function OmniDashboard() {
  const [snapshot, setSnapshot] = React.useState<DashboardSnapshot | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("overview")
  const [pollKey, setPollKey] = React.useState(0)
  const [lastUiRefreshAt, setLastUiRefreshAt] = React.useState<string | null>(
    null
  )

  const refresh = React.useCallback(async (force = false) => {
    setIsRefreshing(true)
    try {
      const nextSnapshot = await loadSnapshot(force)
      setSnapshot(nextSnapshot)
      setError(null)
      setLastUiRefreshAt(new Date().toISOString())
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Collect API polling failed."
      )
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    const initialId = window.setTimeout(() => {
      void refresh(false)
    }, 0)

    const intervalId = window.setInterval(() => {
      void refresh(false)
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearTimeout(initialId)
      window.clearInterval(intervalId)
    }
  }, [refresh, pollKey])

  return (
    <SidebarProvider>
      <AppSidebar
        snapshot={snapshot}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lastUiRefreshAt={lastUiRefreshAt}
      />
      <SidebarInset>
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">
                {activeTab === "overview"
                  ? "Infrastructure Overview"
                  : sourceLabels[activeTab as keyof typeof sourceLabels] ??
                    "Platform Health"}
              </h1>
              <p className="truncate text-[10px] text-muted-foreground">
                Last collect{" "}
                {snapshot
                  ? formatDateTime(snapshot.overview.data.generatedAt)
                  : "loading"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {error ? (
                <Badge variant="destructive">
                  <AlertTriangle data-icon="inline-start" />
                  Poll failed
                </Badge>
              ) : null}
              <HealthBadge health={snapshot?.overview.data.health} />
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Refresh collect snapshot"
                disabled={isRefreshing}
                onClick={() => {
                  void refresh(true)
                  setPollKey((prev) => prev + 1)
                }}
              >
                <RefreshCw
                  data-icon="inline-start"
                  className={cn(isRefreshing && "animate-spin")}
                />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-4 p-4 md:p-6">
          {snapshot ? (
            <DashboardContent
              snapshot={snapshot}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          ) : (
            <DashboardSkeleton />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
