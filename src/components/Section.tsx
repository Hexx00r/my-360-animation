import type { ReactNode } from 'react'
import { Kicker } from '@/components/Shared'
import Reveal from '@/components/Reveal'

/** Shared section shell: anchor id, kicker, H2 and consistent spacing. */
export default function Section({
  id,
  kicker,
  title,
  intro,
  children,
  className = '',
}: {
  id: string
  kicker: string
  title: ReactNode
  intro?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-16 py-20 md:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <Kicker>{kicker}</Kicker>
          <h2
            id={`${id}-title`}
            className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.02em] text-apple-ink md:text-5xl"
          >
            {title}
          </h2>
          {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-apple-sub">{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  )
}
