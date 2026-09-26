import { Globe2, Laptop, MapPin } from 'lucide-react'
import portrait from '@/assets/portrait.jpg'
import Section from '@/components/Section'
import Reveal from '@/components/Reveal'
import { profile } from '@/data/profile'

const FACTS = [
  { icon: MapPin, label: 'Based in', value: profile.location },
  { icon: Laptop, label: 'Works', value: 'Remote-first' },
  { icon: Globe2, label: 'Clients', value: 'AU · US · Global' },
]

export default function About() {
  return (
    <Section id="about" kicker="About" title={<>Frontend to backend, <span className="text-apple-blue">one developer.</span></>}>
      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="mx-auto w-full max-w-sm">
          <div className="rounded-[28px] bg-apple-gray p-3 ring-1 ring-white/10">
            <img
              src={portrait}
              alt={`Portrait of ${profile.name}`}
              width={800}
              height={1280}
              loading="lazy"
              decoding="async"
              className="block aspect-[4/5] w-full rounded-[20px] object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="space-y-5 text-lg leading-relaxed text-apple-sub">
            {profile.bio.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {FACTS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="card rounded-2xl p-5">
                <Icon aria-hidden="true" className="h-5 w-5 text-apple-blue" />
                <dt className="mt-3 text-xs font-semibold uppercase tracking-[0.05em] text-apple-sub">{label}</dt>
                <dd className="mt-1 text-base font-semibold text-apple-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Section>
  )
}
