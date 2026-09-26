/**
 * Tech-brand icons — inline SVGs from Simple Icons (icon data lives in
 * src/lib/tech-icons.ts so this file stays component-only). Uses currentColor:
 * set text-* classes to control the color.
 */
import { TECH_ICONS } from "@/lib/tech-icons"

/** Renders a brand icon; returns null when the brand has no inlined icon
 * (callers then fall back to a text badge). */
export function TechIcon({ name, className = "" }: { name: string; className?: string }) {
  const icon = TECH_ICONS[name]
  if (!icon) return null
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={icon.path} />
    </svg>
  )
}
