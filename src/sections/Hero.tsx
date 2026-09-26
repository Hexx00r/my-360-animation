import { MapPin } from 'lucide-react'
import HeroCanvas from '@/components/HeroCanvas'
import Reveal from '@/components/Reveal'
import { profile } from '@/data/profile'

export default function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-black px-4 pb-16 pt-16 sm:px-6 lg:pb-20 lg:pt-20"
    >
      <div className="relative">
        <HeroCanvas />
      </div>

      <div className="relative mx-auto mt-10 max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.05em] text-apple-sub">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-apple-blue" />
          {profile.location} · Remote · AU / US / Global
        </p>

        {/* Not wrapped in Reveal: the headline paints at full opacity straight
            from the prerendered HTML. */}
        <h1
          id="hero-title"
          className="mt-5 text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.03em] text-apple-ink"
        >
          Full-Stack <span className="text-apple-blue">Web Developer</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg leading-[1.5] text-apple-sub md:text-xl">{profile.valueProp}</p>

        <Reveal delay={150}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="#projects" className="btn-primary">
              View Projects
            </a>
            <a href="#contact" className="btn-secondary">
              Hire Me
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
