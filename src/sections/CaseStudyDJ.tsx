import { BOOKING, Kicker } from '@/components/Shared'
import Reveal from '@/components/Reveal'
import djHero from '@/assets/dj-hero.webp'

export default function CaseStudyDJ() {
  return (
    <section
      id="case-study-dj"
      className="relative scroll-mt-16 overflow-hidden bg-apple-surface"
    >
      {/* Case-study hero: full image at natural size stacked above the copy on
          mobile, full-bleed background from md up */}
      <img
        src={djHero}
        alt=""
        aria-hidden="true"
        width={1600}
        height={825}
        loading="lazy"
        className="relative block h-auto w-full md:absolute md:inset-0 md:h-full md:w-full md:object-cover"
      />
      {/* Darken the shot to 40% brightness so the copy stays crisp (full-bleed layout only) */}
      <div aria-hidden="true" className="absolute inset-0 hidden bg-black/60 md:block" />
      {/* Fade the image into the page background at the bottom edge (full-bleed layout only) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 hidden h-[30%] bg-gradient-to-b from-transparent to-[#0a0a0a] md:block"
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-24 text-center md:min-h-[85vh]">
        <Reveal>
          <Kicker light>Case study 01</Kicker>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.02em] text-apple-ink">
            I didn&apos;t learn GHL from a course.{' '}
            <span className="text-apple-blue">I built this for my family&apos;s business.</span>
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-2xl text-[19px] leading-[1.5] text-apple-sub">
            <strong className="font-semibold text-apple-ink">DJ Property &amp; Cleaning Services</strong>,
            Albury–Wodonga, NSW/VIC. My family&apos;s pressure cleaning business. I built the entire
            GHL system from scratch - funnel, workflows, pipelines, review automation - because I was
            tired of watching leads slip through the cracks while my parents were on the job.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <a
            href={BOOKING}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary mt-9"
          >
            Book a Free Funnel Website Audit
          </a>
        </Reveal>
      </div>
    </section>
  )
}
