import { Cloud, Globe } from 'lucide-react'
import { Kicker } from '@/components/Shared'
import Reveal from '@/components/Reveal'

/* ------------------------------ Projects ---------------------------------- */

const PROJECTS = [
  {
    icon: Cloud,
    name: 'quote-relay',
    desc: 'Production lead-capture pipeline on Cloudflare Workers: webhook endpoint, D1 storage, multi-client routing, Telegram + GHL inbound-webhook notifications. Runs 24/7 on the free tier.',
  },
  {
    icon: Globe,
    name: 'paulsunnydev.com',
    desc: 'Prerendered React portfolio (custom zero-dependency SSR build), 12-article SEO content cluster targeting AU pressure-cleaning keywords, JSON-LD structured data, sub-second static delivery.',
    owned: 'Owned end-to-end: design, build, technical SEO, content strategy, deploy pipeline.',
  },
]

export default function Projects() {
  return (
    <section id="projects" className="scroll-mt-16 bg-apple-surface py-[120px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <Kicker>Projects</Kicker>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-[-0.02em] text-apple-ink md:text-5xl">
            Own builds, <span className="text-apple-blue">running in production.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <Reveal
              key={p.name}
              as="article"
              delay={i * 100}
              className="card card-lift flex flex-col rounded-[28px] p-8 md:p-10"
            >
              <p.icon className="h-10 w-10 text-apple-blue" strokeWidth={1.5} />
              <h3 className="mt-6 text-xl font-semibold text-apple-ink">{p.name}</h3>
              <p className="mt-3 flex-1 text-base leading-relaxed text-apple-sub">{p.desc}</p>
              {p.owned && (
                <p className="mt-5 text-sm font-medium text-apple-blue">{p.owned}</p>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
