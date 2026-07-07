"use client"

import { FluentProvider, SSRProvider, webLightTheme } from "@fluentui/react-components"
import type { ReactNode } from "react"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FluentProvider theme={webLightTheme} style={{ height: "100vh" }}>
      <SSRProvider>{children}</SSRProvider>
    </FluentProvider>
  )
}
