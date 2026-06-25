'use client'
import dynamic from 'next/dynamic'

const SolarScene = dynamic(
  () => import('./SolarScene').then(m => ({ default: m.SolarScene })),
  { ssr: false, loading: () => null }
)

export function SolarSceneLoader() {
  return <SolarScene />
}
