import { ArrowUpRight, Info } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { BrowserShot } from '@/components/Shared'
import { latestBuild, demoFleet } from '@/site.config'

/** Non-negotiable disclaimer on every demo-fleet card. */
const FLEET_PILL = 'Demo build — fictional business'

/**
 * "Latest Build" showcase: sits directly below the Hero on the homepage.
 * All content comes from the `latestBuild` object in site.config.ts; this
 * component never hardcodes project-specific copy.
 */
export default function LatestBuild() {
  const build = latestBuild
  // The featured build must not appear again in the fleet row below it.
  const fleet = demoFleet.filter((d) => d.liveUrl !== build.liveUrl)

  return (
    <section id="latest-build" className="relative scroll-mt-16 overflow-hidden bg-apple-surface">
      {/* Faint cyan glow echoing the hero's radial, anchored on the screenshot side */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 45% 55% at 28% 50%, rgb(0 212 255 / 0.06), transparent 70%)',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:min-h-screen lg:grid-cols-2 lg:gap-20 lg:py-28">
        {/* LEFT: real full-page screenshot in the CSS browser frame, cyan glow */}
        <Reveal>
          <a
            href={build.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative block"
            aria-label={`Open the ${build.name} live demo`}
          >
            {/* Glow ring sits behind the frame (BrowserShot is relative) */}
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-[22px] border border-[rgb(0_212_255/0.25)] shadow-[0_0_80px_rgb(0_212_255/0.15)] transition-shadow duration-300 group-hover:shadow-[0_0_110px_rgb(0_212_255/0.25)]"
            />
            <BrowserShot
              src={build.screenshot.src}
              alt={build.screenshot.alt}
              url={build.screenshot.barUrl}
              width={build.screenshot.width}
              height={build.screenshot.height}
              className="relative max-h-[65vh]"
            />
          </a>
        </Reveal>

        {/* RIGHT: eyebrow, headline, honesty pill, proof chips, CTAs */}
        <div>
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-apple-blue">
              {build.eyebrow}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="mt-4 text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.05] tracking-[-0.02em] text-apple-ink">
              {build.name}
            </h2>
          </Reveal>

          <Reveal delay={150}>
            <p className="mt-5 max-w-lg text-[19px] leading-[1.5] text-apple-sub">{build.pitch}</p>
          </Reveal>

          <Reveal delay={200}>
            {/* Honesty pill: the demo is a fictional business; the label stays. */}
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-apple-sub">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {build.honestyPill}
            </p>
          </Reveal>

          <Reveal delay={250}>
            <ul className="mt-7 flex flex-wrap gap-2.5">
              {build.proofChips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-[rgb(0_212_255/0.35)] px-3.5 py-1.5 text-sm font-medium text-apple-blue"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={build.primaryCta.href}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                {build.primaryCta.label}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href={build.secondaryCta.href} className="btn-secondary">
                {build.secondaryCta.label}
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Demo fleet row: previous demo builds, each labelled as fictional */}
      <div className="relative mx-auto max-w-6xl px-6 pb-24 lg:pb-28">
        <Reveal>
          <div className="flex items-end justify-between gap-6 border-t border-white/10 pt-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-apple-blue">
                Demo fleet
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-[-0.01em] text-apple-ink">
                More demo builds
              </h3>
            </div>
            <p className="hidden max-w-sm text-sm leading-relaxed text-apple-sub sm:block">
              Same system, different niches — every demo runs on the zero-cost stack.
            </p>
          </div>
        </Reveal>

        <div className={`mt-8 grid gap-8 ${fleet.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {fleet.map((demo, i) => (
            <Reveal key={demo.name} delay={i * 100}>
              <a
                href={demo.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative block"
                aria-label={`Open the ${demo.name} live demo`}
              >
                <div
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-[22px] border border-[rgb(0_212_255/0.18)] shadow-[0_0_50px_rgb(0_212_255/0.08)] transition-shadow duration-300 group-hover:shadow-[0_0_80px_rgb(0_212_255/0.18)]"
                />
                <BrowserShot
                  src={demo.screenshot.src}
                  alt={demo.screenshot.alt}
                  url={demo.screenshot.barUrl}
                  width={demo.screenshot.width}
                  height={demo.screenshot.height}
                  imgClassName="h-52 object-cover object-top"
                  className="relative"
                />
              </a>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                  <h4 className="text-lg font-semibold text-apple-ink">{demo.name}</h4>
                  <p className="text-sm text-apple-sub">{demo.niche}</p>
                </div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-apple-sub">
                  <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {FLEET_PILL}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
