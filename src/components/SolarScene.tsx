'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const COLS = 10
const ROWS = 6
const CELL_W = 32
const CELL_H = 34
const TEX_W = COLS * CELL_W
const TEX_H = ROWS * CELL_H

function drawCells(ctx: CanvasRenderingContext2D, sweep: number) {
  ctx.clearRect(0, 0, TEX_W, TEX_H)

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * CELL_W + 1.5
      const y = row * CELL_H + 1.5
      const w = CELL_W - 3
      const h = CELL_H - 3

      const dist = Math.abs(col / (COLS - 1) - sweep)
      const glow = Math.max(0, 1 - dist * 3.2)

      // Cell base
      ctx.fillStyle = `rgba(8, 20, 55, 0.95)`
      ctx.fillRect(x, y, w, h)

      // Glow overlay
      if (glow > 0.01) {
        ctx.fillStyle = `rgba(34, 211, 238, ${glow * 0.28})`
        ctx.fillRect(x, y, w, h)

        // Solar yellow accent at peak
        if (glow > 0.7) {
          ctx.fillStyle = `rgba(250, 204, 21, ${(glow - 0.7) * 0.18})`
          ctx.fillRect(x, y, w, h)
        }
      }

      // Cell border
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.1 + glow * 0.55})`
      ctx.lineWidth = 0.5
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)

      // Busbars (horizontal lines)
      ctx.strokeStyle = `rgba(80, 140, 200, ${0.06 + glow * 0.18})`
      ctx.lineWidth = 0.4
      for (let b = 1; b <= 2; b++) {
        const by = y + (h / 3) * b
        ctx.beginPath()
        ctx.moveTo(x + 1, by)
        ctx.lineTo(x + w - 1, by)
        ctx.stroke()
      }
    }
  }
}

export function SolarScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const W = container.clientWidth
    const H = container.clientHeight

    // ── Renderer ─────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // ── Scene / Camera ────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 50)
    camera.position.set(0, 0, 6)

    // ── Lights ────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a1a3a, 3))

    const sun = new THREE.DirectionalLight(0x99ccff, 4)
    sun.position.set(3, 5, 4)
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0x22D3EE, 1.2)
    fill.position.set(-2, -1, 2)
    scene.add(fill)

    // ── Panel group (offset to the right) ────────────
    const group = new THREE.Group()
    group.position.set(1.5, 0.1, 0)
    group.rotation.set(-0.22, -0.38, 0.07)
    scene.add(group)

    // Frame
    const frameGeo = new THREE.BoxGeometry(3.5, 2.3, 0.09)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.85, roughness: 0.25 })
    group.add(new THREE.Mesh(frameGeo, frameMat))

    // Panel glass body
    const bodyGeo = new THREE.BoxGeometry(3.2, 2.05, 0.06)
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x08122e,
      metalness: 0.05,
      roughness: 0.06,
      reflectivity: 0.9,
    })
    const panelBody = new THREE.Mesh(bodyGeo, bodyMat)
    panelBody.position.z = 0.01
    group.add(panelBody)

    // Cell canvas texture plane
    const cellCanvas = document.createElement('canvas')
    cellCanvas.width = TEX_W
    cellCanvas.height = TEX_H
    const cellCtx = cellCanvas.getContext('2d')!
    const cellTexture = new THREE.CanvasTexture(cellCanvas)

    const cellGeo = new THREE.PlaneGeometry(3.1, 1.98)
    const cellMat = new THREE.MeshBasicMaterial({ map: cellTexture, transparent: true, opacity: 0.94 })
    const cellPlane = new THREE.Mesh(cellGeo, cellMat)
    cellPlane.position.z = 0.048
    group.add(cellPlane)

    // Sweep ray — narrow core
    const rayGeo = new THREE.PlaneGeometry(0.1, 2.1)
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0x22D3EE,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const ray = new THREE.Mesh(rayGeo, rayMat)
    ray.position.z = 0.06
    group.add(ray)

    // Sweep ray — diffuse halo
    const ray2Geo = new THREE.PlaneGeometry(0.55, 2.1)
    const ray2Mat = new THREE.MeshBasicMaterial({
      color: 0x22D3EE,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const ray2 = new THREE.Mesh(ray2Geo, ray2Mat)
    ray2.position.z = 0.055
    group.add(ray2)

    // Incoming light beam from above (angled, yellow-tinted)
    const beamGeo = new THREE.PlaneGeometry(0.18, 4)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xFACC15,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const beam = new THREE.Mesh(beamGeo, beamMat)
    beam.rotation.z = 0.22
    beam.position.set(0, 1.6, 0.12)
    group.add(beam)

    // ── Particle system ───────────────────────────────
    const N = 70
    const pPos = new Float32Array(N * 3)
    const pSpeed = new Float32Array(N)
    const pBaseX = new Float32Array(N)

    for (let i = 0; i < N; i++) {
      pBaseX[i] = (Math.random() - 0.5) * 2.8 + 1.5
      pPos[i * 3] = pBaseX[i]
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 2.2
      pPos[i * 3 + 2] = Math.random() * 0.5
      pSpeed[i] = 0.003 + Math.random() * 0.006
    }

    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0x22D3EE,
      size: 0.028,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    scene.add(new THREE.Points(pGeo, pMat))

    // ── Background glow behind panel ──────────────────
    const bgGeo = new THREE.PlaneGeometry(5, 4)
    const bgMat = new THREE.MeshBasicMaterial({
      color: 0x22D3EE,
      transparent: true,
      opacity: 0.025,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const bgGlow = new THREE.Mesh(bgGeo, bgMat)
    bgGlow.position.set(1.5, 0, -0.3)
    scene.add(bgGlow)

    // ── Mouse parallax ────────────────────────────────
    let targetRX = group.rotation.x
    let targetRY = group.rotation.y
    const baseRX = group.rotation.x
    const baseRY = group.rotation.y

    const onMouse = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      targetRX = baseRX + ny * 0.12
      targetRY = baseRY + nx * 0.18
    }
    window.addEventListener('mousemove', onMouse)

    // ── Resize ────────────────────────────────────────
    const onResize = () => {
      const nW = container.clientWidth
      const nH = container.clientHeight
      camera.aspect = nW / nH
      camera.updateProjectionMatrix()
      renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    // ── Visibility ────────────────────────────────────
    let paused = false
    const onVisibility = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVisibility)

    // ── Animate ───────────────────────────────────────
    let frameId: number
    let t = 0

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      if (paused) return

      t += 0.012

      // Sweep 0→1→0
      const sweep = (Math.sin(t * 0.38) + 1) / 2
      const rayX = (sweep - 0.5) * 3.1

      ray.position.x = rayX
      ray2.position.x = rayX
      beam.position.x = rayX * 0.6

      // Cell canvas update
      drawCells(cellCtx, sweep)
      cellTexture.needsUpdate = true

      // Particles rise
      const attr = pGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < N; i++) {
        attr.array[i * 3 + 1] += pSpeed[i]
        if (attr.array[i * 3 + 1] > 2.2) {
          attr.array[i * 3 + 1] = -1.3
          attr.array[i * 3] = pBaseX[i] + (Math.random() - 0.5) * 0.4
        }
      }
      attr.needsUpdate = true

      // Parallax lerp
      group.rotation.x += (targetRX - group.rotation.x) * 0.04
      group.rotation.y += (targetRY - group.rotation.y) * 0.04

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)

      frameGeo.dispose(); frameMat.dispose()
      bodyGeo.dispose(); bodyMat.dispose()
      cellGeo.dispose(); cellMat.dispose(); cellTexture.dispose()
      rayGeo.dispose(); rayMat.dispose()
      ray2Geo.dispose(); ray2Mat.dispose()
      beamGeo.dispose(); beamMat.dispose()
      bgGeo.dispose(); bgMat.dispose()
      pGeo.dispose(); pMat.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" aria-hidden="true" />
}
