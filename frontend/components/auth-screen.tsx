"use client"

import * as React from "react"
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react"

import { api } from "@/lib/api"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function AuthScreen({
  setupRequired,
  onAuthenticated,
}: {
  setupRequired: boolean
  onAuthenticated: (user: User) => void
}) {
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  async function submit() {
    setError(null)
    try {
      if (setupRequired) {
        await api.setup({
          username,
          password,
        })
        const login = await api.login({ username, password })
        onAuthenticated(login.user)
        return
      }
      const login = await api.login({ username, password })
      onAuthenticated(login.user)
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Login failed."
      )
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{setupRequired ? "Omni setup" : "Omni login"}</CardTitle>
          <CardDescription>
            {setupRequired
              ? "Create the first admin user."
              : "Use your portal account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <TextField
              label="Username"
              value={username}
              onChange={setUsername}
              required
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              required
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit">
              {setupRequired ? (
                <UserPlus data-icon="inline-start" />
              ) : (
                <LogIn data-icon="inline-start" />
              )}
              {setupRequired ? "Create admin" : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  const [visible, setVisible] = React.useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Input
          className="pr-10"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                onClick={() => setVisible((current) => !current)}
              >
                <Icon data-icon="inline-start" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {visible ? "Hide password" : "Show password"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
