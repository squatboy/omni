import * as React from "react"
import { ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { OverviewData } from "@/lib/collect/types"
import { StatusDot } from "./status-badge"

export function ResourceBar({
  label,
  value,
  fallback,
}: {
  label: string
  value: number | null
  fallback: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">
          {value === null ? fallback : `${value}%`}
        </span>
      </div>
      <Progress value={value ?? 0} />
    </div>
  )
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-mono text-sm">{value}</div>
    </div>
  )
}

export function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" size="icon-xs">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${label}`}
      >
        <ExternalLink data-icon="inline-start" />
      </a>
    </Button>
  )
}

export function HealthBadge({
  health,
}: {
  health: OverviewData["health"] | undefined
}) {
  if (!health) {
    return <Badge variant="outline">loading</Badge>
  }

  return (
    <Badge variant={health === "ok" ? "secondary" : "outline"}>
      <StatusDot status={health === "ok" ? "ok" : "stale"} />
      {health}
    </Badge>
  )
}
