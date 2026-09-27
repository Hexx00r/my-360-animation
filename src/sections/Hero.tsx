import { MapPin } from 'lucide-react'
import HeroCanvas from '@/components/HeroCanvas'
import Reveal from '@/components/Reveal'
import { profile } from '@/data/profile'

export default function Hero() {
  return (
    // Fills the viewport below the 3rem sticky header and centers the hero
    // group in it; when the group is taller, the equal py keeps it balanced.
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative flex min-h-[calc(100svh-3rem)] flex-col justify-center overflow-hidden bg-black px-4 py-12 sm:px-6 lg:py-16"
    >
      {/* Below lg: one centered column, gap-8 between image, headline,
          sub-line and CTAs. lg+: image left, text right, both vertically
          centered on the same line. */}
      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-8 lg:max-w-6xl lg:flex-row lg:justify-center lg:gap-16">
        <div className="w-full lg:w-[min(50%,calc(70svh*720/1030))] lg:flex-none">
          <HeroCanvas />
        </div>

        <div className="flex flex-col items-center gap-8 text-center lg:min-w-0 lg:max-w-xl lg:flex-1 lg:items-start lg:text-left">
          <div className="flex flex-col items-center gap-4 lg:items-start">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.05em] text-apple-sub">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-apple-blue" />
              {profile.location} · Remote · AU / US / Global
            </p>

            {/* Not wrapped in Reveal: the headline paints at full opacity straight
                from the prerendered HTML. */}
            <h1
              id="hero-title"
              className="text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.03em] text-apple-ink"
            >
              Full-Stack <span className="text-apple-blue">Web Developer</span>
            </h1>
          </div>

          <p className="max-w-xl text-lg leading-[1.5] text-apple-sub md:text-xl">{profile.valueProp}</p>

          <Reveal delay={150} className="w-full">
            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <a href="#projects" className="btn-primary">
                View Projects
              </a>
              <a href="#contact" className="btn-secondary">
                Hire Me
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
