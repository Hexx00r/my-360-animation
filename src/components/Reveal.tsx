import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  className?: string
  /** Stagger delay in ms */
  delay?: number
  /** Initial vertical offset in px — transform only, keeps animation on the compositor */
  y?: number
  as?: 'div' | 'section' | 'article' | 'li' | 'span'
  style?: CSSProperties
}

/**
 * Fade/slide-in on scroll via IntersectionObserver.
 * Animates opacity + transform only, so it stays 60fps-friendly.
 * Content is always rendered (SEO/no-JS safe); it just starts hidden.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  y = 40,
  as: Tag = 'div',
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  // If IntersectionObserver is unavailable, render visible immediately
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  const hiddenStyle: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translate3d(0, 0, 0)' : `translate3d(0, ${y}px, 0)`,
    transitionProperty: 'opacity, transform',
    transitionDuration: '800ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
    willChange: 'opacity, transform',
  }

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={className}
      style={{ ...hiddenStyle, ...style }}
    >
      {children}
    </Tag>
  )
}
