import type { ReactNode } from 'react'

export const RESUME = `${import.meta.env.BASE_URL}Paul-Sunny-Isogon-Resume.pdf`

/** Section label: all-caps, 12px, wide tracking, muted gray. */
export function Kicker({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.05em] ${
        light ? 'text-white/60' : 'text-apple-sub'
      }`}
    >
      {children}
    </p>
  )
}
