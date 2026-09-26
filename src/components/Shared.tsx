import type { ReactNode } from 'react'

export const EMAIL = 'paulsunnyisogon@gmail.com'
export const MAILTO = `mailto:${EMAIL}?subject=Free%20Funnel%20Website%20Audit%20Request`
export const YOUTUBE = 'https://youtu.be/BoxC1hGvrZo?si=PS-OS4KbCIEolAGV'
export const BOOKING = 'https://api.leadconnectorhq.com/widget/booking/3VFHT95QH0s3uIZ7ED9H'
export const RESUME = 'Paul-Sunny-Isogon-Resume.pdf'

/**
 * Section label — all-caps, 12px, wide tracking, muted gray.
 * ("WHAT I BUILD", "CASE STUDY 01", "TRY THE CALCULATOR")
 */
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

/** Cyan text link with an arrow that nudges right on hover */
export function LinkArrow({
  href,
  children,
  className = '',
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-1.5 text-apple-blue transition-colors hover:text-apple-blueDark ${className}`}
    >
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="h-3 w-3 fill-current transition-transform duration-300 group-hover:translate-x-1"
      >
        <path d="M4.5 1.5 9 6l-4.5 4.5-1-1L7 6 3.5 2.5z" />
      </svg>
    </a>
  )
}

/** Screenshot framed as a sleek dark device bezel (browser-style) */
export function BrowserShot({
  src,
  alt,
  url,
  width,
  height,
  className = '',
  imgClassName = '',
}: {
  src: string
  alt: string
  url?: string
  /** Natural pixel size — recommended (prevents layout shift) but optional. */
  width?: number
  height?: number
  className?: string
  /** Optional extra classes for the img itself (e.g. fixed-height object-cover crop). */
  imgClassName?: string
}) {
  return (
    <figure
      className={`overflow-hidden rounded-[18px] border border-apple-hairline bg-black shadow-card ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-apple-borderSoft bg-apple-surface px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-apple-trafficRed" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-apple-trafficYellow" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-apple-trafficGreen" aria-hidden="true" />
        {url && (
          <span className="ml-3 truncate rounded-full bg-apple-gray px-3 py-0.5 text-[11px] font-medium text-apple-sub">
            {url}
          </span>
        )}
      </div>
      <img src={src} alt={alt} width={width} height={height} loading="lazy" className={`block h-auto w-full ${imgClassName}`} />
    </figure>
  )
}
