"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowDownloadRegular,
  CubeRegular,
  DismissRegular,
  DocumentRegular,
  EyeRegular,
  ImageRegular,
} from "@fluentui/react-icons"
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Spinner,
  Text,
} from "@fluentui/react-components"
import type { FileItem } from "@/lib/types"
import {
  getPreviewKind,
  getPreviewUrl,
  MAX_TEXT_PREVIEW_BYTES,
  type PreviewKind,
} from "@/lib/preview"
import { CodePreviewView } from "@/components/code-preview-view"

interface FilePreviewDialogProps {
  file: FileItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function PreviewTitleIcon({ kind }: { kind: PreviewKind | null }) {
  if (kind === "stl") return <CubeRegular style={{ color: "#5c2d91" }} />
  if (kind === "image") return <ImageRegular style={{ color: "#038387" }} />
  if (kind === "pdf") return <DocumentRegular style={{ color: "#d83b01" }} />
  return <EyeRegular style={{ color: "#0078d4" }} />
}

function StlPreviewPane({ file }: { file: FileItem }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file || !containerRef.current) return

    const container = containerRef.current
    let disposed = false
    let animationId = 0

    setLoading(true)
    setError(null)

    async function initViewer() {
      try {
        const THREE = await import("three")
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js")
        const { STLLoader } = await import("three/addons/loaders/STLLoader.js")

        if (disposed) return

        const width = container.clientWidth
        const height = container.clientHeight

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xf3f2f1)

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        container.innerHTML = ""
        container.appendChild(renderer.domElement)

        scene.add(new THREE.AmbientLight(0xffffff, 0.55))
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.85)
        keyLight.position.set(1, 2, 3)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.35)
        fillLight.position.set(-2, -1, -1)
        scene.add(keyLight, fillLight)

        scene.add(new THREE.GridHelper(200, 20, 0xc8c6c4, 0xe1dfdd))

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08

        const response = await fetch(getPreviewUrl(file.id))
        if (!response.ok) throw new Error("STL-Datei konnte nicht geladen werden")

        const geometry = new STLLoader().parse(await response.arrayBuffer())
        geometry.computeBoundingBox()
        geometry.center()
        geometry.computeVertexNormals()

        const material = new THREE.MeshStandardMaterial({
          color: 0x0078d4,
          metalness: 0.15,
          roughness: 0.45,
        })
        const mesh = new THREE.Mesh(geometry, material)

        const box = new THREE.Box3().setFromObject(mesh)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = maxDim > 0 ? 80 / maxDim : 1
        mesh.scale.setScalar(scale)

        const scaledBox = new THREE.Box3().setFromObject(mesh)
        const center = scaledBox.getCenter(new THREE.Vector3())
        mesh.position.sub(center)
        mesh.position.y -= scaledBox.min.y
        scene.add(mesh)

        const distance = maxDim * scale * 1.8
        camera.position.set(distance * 0.8, distance * 0.6, distance * 0.8)
        camera.lookAt(0, maxDim * scale * 0.3, 0)
        controls.target.set(0, maxDim * scale * 0.3, 0)
        controls.update()

        const animate = () => {
          if (disposed) return
          animationId = requestAnimationFrame(animate)
          controls.update()
          renderer.render(scene, camera)
        }
        animate()

        const handleResize = () => {
          if (disposed) return
          const w = container.clientWidth
          const h = container.clientHeight
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        window.addEventListener("resize", handleResize)
        setLoading(false)

        return () => {
          window.removeEventListener("resize", handleResize)
          controls.dispose()
          geometry.dispose()
          material.dispose()
          renderer.dispose()
        }
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : "Vorschau fehlgeschlagen")
          setLoading(false)
        }
      }
    }

    const cleanupPromise = initViewer()

    return () => {
      disposed = true
      cancelAnimationFrame(animationId)
      container.innerHTML = ""
      cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [file])

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 480,
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid #e1dfdd",
          background: "#f3f2f1",
        }}
      />
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(243,242,241,0.8)",
          }}
        >
          <Spinner size="large" label="3D-Modell wird geladen…" />
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#faf9f8",
          }}
        >
          <Text style={{ color: "#d83b01" }}>{error}</Text>
        </div>
      )}
    </div>
  )
}

function TextCodePreviewPane({ file, kind }: { file: FileItem; kind: "text" | "code" }) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setContent(null)

    if (file.size !== null && file.size > MAX_TEXT_PREVIEW_BYTES) {
      setError(`Datei zu groß für Vorschau (max. ${Math.round(MAX_TEXT_PREVIEW_BYTES / 1024)} KB).`)
      setLoading(false)
      return
    }

    fetch(getPreviewUrl(file.id))
      .then(async (response) => {
        if (!response.ok) throw new Error("Datei konnte nicht geladen werden")
        return response.text()
      })
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Vorschau fehlgeschlagen")
        setLoading(false)
      })
  }, [file])

  if (loading) {
    return (
      <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="large" label="Inhalt wird geladen…" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#d83b01" }}>{error}</Text>
      </div>
    )
  }

  if (content === null) return null

  return <CodePreviewView content={content} fileName={file.name} kind={kind} />
}

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const kind = file ? getPreviewKind(file) : null
  const previewUrl = file ? getPreviewUrl(file.id) : ""

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface style={{ maxWidth: kind === "pdf" || kind === "stl" ? 900 : 860, width: "92vw" }}>
        <DialogBody>
          <DialogTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PreviewTitleIcon kind={kind} />
              {file?.name ?? "Vorschau"}
            </div>
          </DialogTitle>
          <DialogContent>
            {file && kind === "stl" && <StlPreviewPane file={file} />}

            {file && kind === "image" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 320,
                  maxHeight: 520,
                  overflow: "auto",
                  borderRadius: 6,
                  border: "1px solid #e1dfdd",
                  background: "#faf9f8",
                  padding: 16,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={file.name}
                  style={{ maxWidth: "100%", maxHeight: 480, objectFit: "contain" }}
                />
              </div>
            )}

            {file && kind === "pdf" && (
              <iframe
                src={previewUrl}
                title={file.name}
                style={{
                  width: "100%",
                  height: 520,
                  border: "1px solid #e1dfdd",
                  borderRadius: 6,
                  background: "#fff",
                }}
              />
            )}

            {file && (kind === "text" || kind === "code") && (
              <TextCodePreviewPane file={file} kind={kind} />
            )}

            {kind === "stl" && (
              <Text style={{ fontSize: 12, color: "#8a8886", marginTop: 10, display: "block" }}>
                Ziehen zum Drehen · Scrollen zum Zoomen · Rechtsklick zum Verschieben
              </Text>
            )}
          </DialogContent>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8 }}>
            {file && (
              <Button
                icon={<ArrowDownloadRegular />}
                appearance="secondary"
                onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
              >
                Herunterladen
              </Button>
            )}
            <Button
              icon={<DismissRegular />}
              appearance="primary"
              onClick={() => onOpenChange(false)}
              style={{ background: "#0078d4" }}
            >
              Schließen
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
