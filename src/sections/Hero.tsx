import { useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { BOOKING, YOUTUBE } from '@/components/Shared'
import { VideoModal } from '@/lib/video-modal'
import HeroCanvas from '@/components/HeroCanvas'
import Reveal from '@/components/Reveal'

// Modal video ID — derived from the YOUTUBE link in components/Shared.tsx so
// the no-JS fallback href and the modal player can never drift apart.
const DEMO_VIDEO_ID = YOUTUBE.match(/youtu\.be\/([\w-]+)/)?.[1] ?? ''

export default function Hero() {
  // With JS, "Watch the Demo" opens the modal; without JS the plain YouTube
  // href in the prerendered HTML still works.
  useEffect(() => {
    const modal = new VideoModal({
      videoId: DEMO_VIDEO_ID,
      triggerSelector: 'a[data-video-modal]',
      autoplay: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
    return () => modal.destroy()
  }, [])

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-black lg:items-center"
    >
      {/* 360° cursor-tracking portrait. Face sits right of center on desktop,
          top-center on mobile — see LAYOUT in components/HeroCanvas.tsx. */}
      <HeroCanvas />

      {/* Mobile: darken the lower half so the copy stays readable over the photo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/85 to-transparent lg:hidden"
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-14 pt-32 text-center lg:pb-0 lg:pt-0 lg:text-left">
        <div className="mx-auto max-w-xl lg:mx-0">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.05em] text-apple-sub">
              <MapPin className="h-3.5 w-3.5 text-apple-blue" />
              Philippines-based · Serving AU · US · UK
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-6 text-[clamp(2.5rem,5.2vw,4.75rem)] font-bold leading-[1.04] tracking-[-0.02em] text-apple-ink">
              Your website should work harder than your pressure washer.
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 text-[18px] leading-[1.5] text-apple-sub md:text-xl">
              Complete GoHighLevel systems, plus the custom code, webhooks, and technical SEO most GHL
              freelancers can&apos;t touch.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <a href={BOOKING} target="_blank" rel="noreferrer" className="btn-primary">
                Book a Free Funnel Website Audit
              </a>
              <a href={YOUTUBE} target="_blank" rel="noreferrer" data-video-modal className="btn-secondary">
                Watch the Demo
              </a>
            </div>
          </Reveal>

          <p className="mt-8 hidden items-center gap-2 text-xs tracking-[0.05em] text-apple-sub lg:inline-flex">
            <span className="h-2 w-2 rounded-full border border-apple-sub" />
            Move your cursor — I&apos;ll follow it
          </p>
        </div>
      </div>
    </section>
  )
}
