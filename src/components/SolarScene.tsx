'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'

const PANEL_W  = 3.4
const PANEL_H  = 2.2
const CELL_COLS = 10
const CELL_ROWS = 6
const TEX_W = CELL_COLS * 34
const TEX_H = CELL_ROWS * 36

const LAYERS = [
  { label: 'Cadre aluminium anodisé', color: '#94a3b8', zFinal:  2.8 },
  { label: 'Verre trempé anti-reflet', color: '#7dd3fc', zFinal:  1.8 },
  { label: 'Encapsulant EVA avant',    color: '#fde68a', zFinal:  0.8 },
  { label: 'Cellules mono PERC',       color: '#22d3ee', zFinal:  0   },
  { label: 'Encapsulant EVA arrière',  color: '#fde68a', zFinal: -0.8 },
  { label: 'Backsheet polymère',       color: '#cbd5e1', zFinal: -1.8 },
  { label: 'Boîtier de jonction',      color: '#c4b5fd', zFinal: -2.8 },
]

function drawCells(ctx: CanvasRenderingContext2D, sweep: number) {
  ctx.clearRect(0, 0, TEX_W, TEX_H)
  const cw = TEX_W / CELL_COLS
  const ch = TEX_H / CELL_ROWS

  for (let row = 0; row < CELL_ROWS; row++) {
    for (let col = 0; col < CELL_COLS; col++) {
      const x = col * cw + 1.5
      const y = row * ch + 1.5
      const w = cw - 3
      const h = ch - 3

      const dist  = Math.abs(col / (CELL_COLS - 1) - sweep)
      const glow  = Math.max(0, 1 - dist * 3.5)

      // Cell body — deep monocrystalline blue
      ctx.fillStyle = `rgba(5, 14, 48, 0.97)`
      ctx.fillRect(x, y, w, h)

      // Diagonal iridescence (PERC anti-reflection pattern)
      const grad = ctx.createLinearGradient(x, y, x + w, y + h)
      grad.addColorStop(0,   `rgba(20, 50, 120, 0.4)`)
      grad.addColorStop(0.4, `rgba(10, 30, 80,  0.0)`)
      grad.addColorStop(1,   `rgba(30, 80, 160, 0.3)`)
      ctx.fillStyle = grad
      ctx.fillRect(x, y, w, h)

      // Sweep glow overlay
      if (glow > 0.01) {
        ctx.fillStyle = `rgba(34, 211, 238, ${glow * 0.22})`
        ctx.fillRect(x, y, w, h)
        if (glow > 0.65) {
          ctx.fillStyle = `rgba(245, 158, 11, ${(glow - 0.65) * 0.14})`
          ctx.fillRect(x, y, w, h)
        }
      }

      // Cell border
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.08 + glow * 0.45})`
      ctx.lineWidth = 0.5
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)

      // Busbars (3 horizontal silver lines)
      ctx.strokeStyle = `rgba(160, 190, 220, ${0.07 + glow * 0.22})`
      ctx.lineWidth = 0.5
      for (let b = 1; b <= 3; b++) {
        const by = y + (h / 4) * b
        ctx.beginPath(); ctx.moveTo(x + 2, by); ctx.lineTo(x + w - 2, by); ctx.stroke()
      }

      // Finger lines (vertical thin lines between busbars)
      ctx.strokeStyle = `rgba(120, 160, 200, ${0.04 + glow * 0.1})`
      ctx.lineWidth = 0.3
      for (let f = 1; f <= 6; f++) {
        const fx = x + (w / 7) * f
        ctx.beginPath(); ctx.moveTo(fx, y + 2); ctx.lineTo(fx, y + h - 2); ctx.stroke()
      }
    }
  }
}

export function SolarScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [exploding, setExploding] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Renderer ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = false
    container.appendChild(renderer.domElement)

    // ── Scene / Camera ────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 60)
    camera.position.set(0, 0.3, 8)

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a1030, 2.5))

    const sunLight = new THREE.DirectionalLight(0xfff5d6, 5)
    sunLight.position.set(4, 6, 5)
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x7c3aed, 1.8)
    fillLight.position.set(-3, -1, 3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x22d3ee, 1.2)
    rimLight.position.set(2, -2, -3)
    scene.add(rimLight)

    // ── Panel group ───────────────────────────────────────────
    const group = new THREE.Group()
    group.rotation.set(-0.15, -0.35, 0.05)
    scene.add(group)

    // ── Layer meshes ──────────────────────────────────────────
    const layerMeshes: THREE.Object3D[] = []

    // LAYER 0 — Aluminum frame (4 thin bars)
    {
      const frameGroup = new THREE.Group()
      const mat = new THREE.MeshStandardMaterial({ color: 0x283848, metalness: 0.88, roughness: 0.18 })
      const barH  = new THREE.Mesh(new THREE.BoxGeometry(PANEL_W + 0.08, 0.1, 0.1), mat)
      const barHb = barH.clone()
      barH.position.y  =  PANEL_H / 2 + 0.04
      barHb.position.y = -PANEL_H / 2 - 0.04
      const barV  = new THREE.Mesh(new THREE.BoxGeometry(0.1, PANEL_H + 0.08, 0.1), mat)
      const barVr = barV.clone()
      barV.position.x  = -PANEL_W / 2 - 0.04
      barVr.position.x =  PANEL_W / 2 + 0.04
      frameGroup.add(barH, barHb, barV, barVr)
      group.add(frameGroup)
      layerMeshes.push(frameGroup)
    }

    // LAYER 1 — Anti-reflective tempered glass
    {
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0a2840,
        metalness: 0,
        roughness: 0.01,
        transmission: 0.72,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
      })
      const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W - 0.08, PANEL_H - 0.08), glassMat)
      group.add(glassMesh)
      layerMeshes.push(glassMesh)
    }

    // LAYER 2 — EVA encapsulant (front)
    {
      const evaMat = new THREE.MeshBasicMaterial({
        color: 0xfef3c7,
        transparent: true,
        opacity: 0.09,
        side: THREE.DoubleSide,
      })
      const evaFront = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W - 0.14, PANEL_H - 0.14), evaMat)
      group.add(evaFront)
      layerMeshes.push(evaFront)
    }

    // LAYER 3 — Monocrystalline PERC cells (canvas texture)
    {
      const canvas = document.createElement('canvas')
      canvas.width = TEX_W; canvas.height = TEX_H
      const ctx = canvas.getContext('2d')!
      const cellTex = new THREE.CanvasTexture(canvas)

      const cellMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(PANEL_W - 0.16, PANEL_H - 0.18),
        new THREE.MeshBasicMaterial({ map: cellTex, transparent: true, opacity: 0.97 }),
      )
      group.add(cellMesh)
      layerMeshes.push(cellMesh)

      // Store canvas refs for animation loop
      const extMesh = cellMesh as unknown as THREE.Mesh & { _ctx: CanvasRenderingContext2D; _tex: THREE.CanvasTexture }
      extMesh._ctx = ctx
      extMesh._tex = cellTex
    }

    // Sweep ray overlay (on cell layer, z offset handled by cells)
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
    const rayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.08, PANEL_H - 0.2), rayMat)
    group.add(rayMesh)

    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, transparent: true, opacity: 0.06,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
    const haloMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, PANEL_H - 0.2), haloMat)
    group.add(haloMesh)

    // LAYER 4 — EVA encapsulant (back)
    {
      const evaMat = new THREE.MeshBasicMaterial({
        color: 0xfef3c7, transparent: true, opacity: 0.07, side: THREE.DoubleSide,
      })
      const evaBack = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W - 0.14, PANEL_H - 0.14), evaMat)
      group.add(evaBack)
      layerMeshes.push(evaBack)
    }

    // LAYER 5 — Backsheet (white polymer)
    {
      const bsMat = new THREE.MeshStandardMaterial({
        color: 0xd8dde5, metalness: 0, roughness: 0.55, side: THREE.DoubleSide,
      })
      const backsheet = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W - 0.08, PANEL_H - 0.08), bsMat)
      group.add(backsheet)
      layerMeshes.push(backsheet)
    }

    // LAYER 6 — Junction box with MC4 cable stubs
    {
      const jBoxGroup = new THREE.Group()
      jBoxGroup.position.set(0.25, -0.55, 0)

      const boxMat = new THREE.MeshStandardMaterial({ color: 0x111418, metalness: 0.25, roughness: 0.75 })
      const jBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.07), boxMat)
      jBoxGroup.add(jBox)

      const cableMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 0.5, roughness: 0.6 })
      const cableGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8)
      const cableL = new THREE.Mesh(cableGeo, cableMat)
      cableL.position.set(-0.1, -0.22, 0)
      const cableR = new THREE.Mesh(cableGeo, cableMat)
      cableR.position.set(0.1, -0.22, 0)
      jBoxGroup.add(cableL, cableR)

      // MC4 connector tips (small cylinders)
      const tipMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
      const tipGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8)
      const tipL = new THREE.Mesh(tipGeo, tipMat)
      tipL.position.set(-0.1, -0.36, 0)
      const tipR = new THREE.Mesh(tipGeo, tipMat)
      tipR.position.set(0.1, -0.36, 0)
      jBoxGroup.add(tipL, tipR)

      group.add(jBoxGroup)
      layerMeshes.push(jBoxGroup)
    }

    // ── Floating particles ─────────────────────────────────────
    const N = 55
    const pPos   = new Float32Array(N * 3)
    const pSpeed = new Float32Array(N)
    const pBaseX = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      pBaseX[i]     = (Math.random() - 0.5) * (PANEL_W - 0.4)
      pPos[i * 3]   = pBaseX[i]
      pPos[i*3 + 1] = (Math.random() - 0.5) * PANEL_H
      pPos[i*3 + 2] = Math.random() * 0.4
      pSpeed[i]     = 0.004 + Math.random() * 0.007
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0x22d3ee, size: 0.022, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    scene.add(new THREE.Points(pGeo, pMat))

    // ── GSAP decomposition timeline ───────────────────────────
    if (!reducedMotion) {
      const explodeTl = gsap.timeline({
        repeat: -1,
        onStart:  () => setExploding(true),
        onRepeat: () => setExploding(true),
      })

      // Explode phase: each layer fans out from t=1.2s with 90ms stagger
      layerMeshes.forEach((mesh, i) => {
        explodeTl.to(mesh.position, {
          z: LAYERS[i].zFinal,
          duration: 2.0,
          ease: 'expo.out',
        }, 1.2 + i * 0.09)
      })

      // Hold exploded for 3.5s, then implode from outer layers inward
      const implodeStart = 1.2 + (layerMeshes.length - 1) * 0.09 + 2.0 + 3.5
      ;[...layerMeshes].reverse().forEach((mesh, i) => {
        explodeTl.to(mesh.position, {
          z: 0,
          duration: 1.3,
          ease: 'power3.inOut',
          onStart: i === 0 ? () => setExploding(false) : undefined,
        }, implodeStart + i * 0.07)
      })

      // Pad timeline so repeat delay is clean
      explodeTl.to({}, { duration: 1.5 }, implodeStart + layerMeshes.length * 0.07 + 1.3)
    } else {
      // Reduced motion: static exploded view
      layerMeshes.forEach((mesh, i) => { mesh.position.z = LAYERS[i].zFinal * 0.6 })
      setExploding(true)
    }

    // ── Mouse / touch parallax ─────────────────────────────────
    const baseRX = group.rotation.x
    const baseRY = group.rotation.y
    let targetRX = baseRX
    let targetRY = baseRY

    const onMouse = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth  - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      targetRX = baseRX + ny * 0.1
      targetRY = baseRY + nx * 0.16
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      const nx = t.clientX / window.innerWidth  - 0.5
      const ny = t.clientY / window.innerHeight - 0.5
      targetRX = baseRX + ny * 0.08
      targetRY = baseRY + nx * 0.12
    }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch, { passive: true })

    // ── Resize (ResizeObserver) ────────────────────────────────
    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    // ── Visibility pause ──────────────────────────────────────
    let paused = false
    const onVis = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVis)

    // ── Render loop ───────────────────────────────────────────
    let frameId: number
    let t = 0
    const cellMesh = layerMeshes[3] as THREE.Mesh & {
      _ctx: CanvasRenderingContext2D
      _tex: THREE.CanvasTexture
    }

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      if (paused) return
      t += 0.011

      // Sweep animation on cell layer
      const sweep = (Math.sin(t * 0.35) + 1) / 2
      if (cellMesh._ctx) {
        drawCells(cellMesh._ctx, sweep)
        cellMesh._tex.needsUpdate = true
      }

      // Move ray with sweep
      const rayX = (sweep - 0.5) * (PANEL_W - 0.3)
      rayMesh.position.x  = rayX
      haloMesh.position.x = rayX

      // Sync ray z to cell layer z
      const cellZ = layerMeshes[3].position.z
      rayMesh.position.z  = cellZ + 0.015
      haloMesh.position.z = cellZ + 0.01

      // Particles rise
      const attr = pGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < N; i++) {
        attr.array[i * 3 + 1] += pSpeed[i]
        if (attr.array[i * 3 + 1] > PANEL_H * 0.6) {
          attr.array[i * 3 + 1] = -PANEL_H * 0.6
          attr.array[i * 3]     = pBaseX[i] + (Math.random() - 0.5) * 0.35
        }
      }
      attr.needsUpdate = true

      // Subtle group breath
      group.rotation.z = Math.sin(t * 0.18) * 0.008

      // Parallax lerp
      group.rotation.x += (targetRX - group.rotation.x) * 0.05
      group.rotation.y += (targetRY - group.rotation.y) * 0.05

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      gsap.killTweensOf(layerMeshes.map(m => m.position))
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
      document.removeEventListener('visibilitychange', onVis)
      ro.disconnect()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Three.js canvas */}
      <div ref={containerRef} className="w-full h-full" aria-hidden="true" />

      {/* Layer labels overlay — right side */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 pr-3 pointer-events-none hidden md:flex"
      >
        {LAYERS.map((layer, i) => (
          <div
            key={i}
            className="flex items-center gap-2 transition-all duration-700"
            style={{
              opacity: exploding ? 1 : 0.25,
              transform: exploding ? 'translateX(0)' : 'translateX(8px)',
              transitionDelay: `${i * 60}ms`,
            }}
          >
            <div
              className="h-px flex-1"
              style={{
                width: '20px',
                background: layer.color,
                opacity: 0.5,
                boxShadow: `0 0 4px ${layer.color}`,
              }}
            />
            <span
              className="text-[10px] font-medium whitespace-nowrap"
              style={{
                color: layer.color,
                fontFamily: "'Sora', sans-serif",
                textShadow: `0 0 8px ${layer.color}60`,
              }}
            >
              {layer.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
