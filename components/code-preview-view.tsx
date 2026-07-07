"use client"

import { useEffect, useMemo, useState } from "react"
import "./code-preview-view.css"
import {
  getHighlightLanguage,
  getPreviewLanguageLabel,
  MAX_TEXT_PREVIEW_BYTES,
  type PreviewKind,
} from "@/lib/preview"

interface CodePreviewViewProps {
  content: string
  fileName: string
  kind: Extract<PreviewKind, "text" | "code">
}

const VS_CODE_THEME = {
  background: "#1e1e1e",
  titleBar: "#323233",
  tabActive: "#1e1e1e",
  tabInactive: "#2d2d2d",
  border: "#2b2b2b",
  gutterBg: "#1e1e1e",
  gutterText: "#858585",
  text: "#d4d4d4",
  accent: "#007acc",
}

export function CodePreviewView({ content, fileName, kind }: CodePreviewViewProps) {
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const lines = useMemo(() => content.split("\n"), [content])
  const language = getHighlightLanguage(fileName)
  const languageLabel = getPreviewLanguageLabel(fileName, kind)

  useEffect(() => {
    let cancelled = false

    async function highlight() {
      const { default: hljsCore } = await import("highlight.js/lib/core")

      const languageLoaders: Record<string, () => Promise<{ default: unknown }>> = {
        javascript: () => import("highlight.js/lib/languages/javascript"),
        typescript: () => import("highlight.js/lib/languages/typescript"),
        python: () => import("highlight.js/lib/languages/python"),
        json: () => import("highlight.js/lib/languages/json"),
        xml: () => import("highlight.js/lib/languages/xml"),
        css: () => import("highlight.js/lib/languages/css"),
        scss: () => import("highlight.js/lib/languages/scss"),
        bash: () => import("highlight.js/lib/languages/bash"),
        sql: () => import("highlight.js/lib/languages/sql"),
        yaml: () => import("highlight.js/lib/languages/yaml"),
        markdown: () => import("highlight.js/lib/languages/markdown"),
        rust: () => import("highlight.js/lib/languages/rust"),
        go: () => import("highlight.js/lib/languages/go"),
        java: () => import("highlight.js/lib/languages/java"),
        csharp: () => import("highlight.js/lib/languages/csharp"),
        cpp: () => import("highlight.js/lib/languages/cpp"),
        php: () => import("highlight.js/lib/languages/php"),
        ruby: () => import("highlight.js/lib/languages/ruby"),
        kotlin: () => import("highlight.js/lib/languages/kotlin"),
        swift: () => import("highlight.js/lib/languages/swift"),
        dockerfile: () => import("highlight.js/lib/languages/dockerfile"),
        ini: () => import("highlight.js/lib/languages/ini"),
        graphql: () => import("highlight.js/lib/languages/graphql"),
        powershell: () => import("highlight.js/lib/languages/powershell"),
      }

      if (language && languageLoaders[language]) {
        const mod = await languageLoaders[language]()
        hljsCore.registerLanguage(
          language,
          mod.default as Parameters<typeof hljsCore.registerLanguage>[1]
        )
      }

      if (cancelled) return

      if (kind === "code" && language && hljsCore.getLanguage(language)) {
        setHighlighted(hljsCore.highlight(content, { language }).value)
        return
      }

      if (kind === "code") {
        setHighlighted(hljsCore.highlightAuto(content).value)
        return
      }

      setHighlighted(
        content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
      )
    }

    void highlight()

    return () => {
      cancelled = true
    }
  }, [content, fileName, kind, language])

  return (
    <div
      style={{
        borderRadius: 6,
        overflow: "hidden",
        border: `1px solid ${VS_CODE_THEME.border}`,
        background: VS_CODE_THEME.background,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: VS_CODE_THEME.titleBar,
          borderBottom: `1px solid ${VS_CODE_THEME.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div
          style={{
            marginLeft: 8,
            padding: "4px 10px",
            borderRadius: "4px 4px 0 0",
            background: VS_CODE_THEME.tabActive,
            color: VS_CODE_THEME.text,
            fontSize: 12,
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          }}
        >
          {fileName}
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: VS_CODE_THEME.gutterText,
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          }}
        >
          {languageLabel}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          maxHeight: 520,
          overflow: "auto",
          background: VS_CODE_THEME.background,
        }}
      >
        <pre
          aria-hidden="true"
          style={{
            margin: 0,
            padding: "16px 12px",
            textAlign: "right",
            userSelect: "none",
            color: VS_CODE_THEME.gutterText,
            background: VS_CODE_THEME.gutterBg,
            borderRight: `1px solid ${VS_CODE_THEME.border}`,
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
            fontSize: 13,
            lineHeight: "20px",
          }}
        >
          {lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </pre>

        <pre
          style={{
            margin: 0,
            padding: "16px 20px",
            flex: 1,
            color: VS_CODE_THEME.text,
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
            fontSize: 13,
            lineHeight: "20px",
            tabSize: 2,
          }}
        >
          {highlighted === null ? (
            <code>{content}</code>
          ) : (
            <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
          )}
        </pre>
      </div>
    </div>
  )
}

export function isTextPreviewTooLarge(size: number | null): boolean {
  return size !== null && size > MAX_TEXT_PREVIEW_BYTES
}
