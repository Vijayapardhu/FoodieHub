"use client"

import { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

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
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-4">
          <Card className="w-full max-w-md rounded-3xl border border-orange-100 bg-white/90 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Something went wrong
                </h1>
                <p className="text-sm text-muted-foreground">
                  {this.state.error?.message || "An unexpected error occurred"}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null })
                    window.location.reload()
                  }}
                  className="w-full rounded-full bg-primary text-white hover:bg-primary/90"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Link href="/home" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

