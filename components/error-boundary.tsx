"use client"

import { Component, ReactNode } from "react"
import Link from "next/link"
import { AlertCircle, Home, RefreshCw } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[error-boundary]", error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
          <AlertCircle className="h-7 w-7" />
        </span>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
            {this.state.error?.message ||
              "An unexpected error stopped this screen from loading."}
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button
            size="lg"
            block
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button size="lg" variant="outline" block asChild>
            <Link href="/home">
              <Home className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}
