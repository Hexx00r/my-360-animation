import { Bot, LifeBuoy, MonitorSmartphone, Plug, Workflow, type LucideIcon } from 'lucide-react'
import Section from '@/components/Section'
import Reveal from '@/components/Reveal'
import { services, type Service } from '@/data/services'

const ICONS: Record<Service['id'], LucideIcon> = {
  websites: MonitorSmartphone,
  integrations: Plug,
  'crm-automation': Workflow,
  'ai-agents': Bot,
  retainer: LifeBuoy,
}

export default function Services() {
  return (
    <Section
      id="services"
      kicker="Services"
      title={<>What I can build <span className="text-apple-blue">for you.</span></>}
    >
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => {
          const Icon = ICONS[s.id]
          return (
            <Reveal key={s.id} as="article" delay={i * 60} className="card card-lift flex flex-col rounded-[24px] p-6 md:p-7">
              <Icon aria-hidden="true" className="h-8 w-8 text-apple-blue" strokeWidth={1.5} />
              <h3 className="mt-5 text-lg font-semibold text-apple-ink">{s.title}</h3>
              <p className="mt-2 flex-1 text-base leading-relaxed text-apple-sub">{s.description}</p>
            </Reveal>
          )
        })}
        <Reveal
          as="article"
          delay={services.length * 60}
          className="flex flex-col justify-center rounded-[24px] border border-dashed border-apple-blueMist p-6 md:p-7"
        >
          <h3 className="text-lg font-semibold text-apple-ink">Not sure where yours fits?</h3>
          <p className="mt-2 text-base leading-relaxed text-apple-sub">
            Ask the chat in the corner, or describe the problem and I&apos;ll tell you what I&apos;d build.
          </p>
          <a href="#contact" className="mt-5 self-start font-semibold text-apple-blue hover:text-apple-blueDark">
            Start a conversation →
          </a>
        </Reveal>
      </div>
    </Section>
  )
}
