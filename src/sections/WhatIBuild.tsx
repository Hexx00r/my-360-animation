import {
  CalendarClock,
  GitBranch,
  KanbanSquare,
  MessageSquareText,
  Plug,
  Star,
} from 'lucide-react'
import { Kicker } from '@/components/Shared'
import Reveal from '@/components/Reveal'

/* ------------------------------- What I Build ------------------------------ */

const BUILD_ITEMS = [
  {
    icon: GitBranch,
    title: 'Instant Quote Calculator Funnel',
    desc: 'Two-step form (services → contact) with live pricing. House wash, driveway, roof, brick, gutter - per-m² pricing logic built in.',
  },
  {
    icon: KanbanSquare,
    title: 'GHL Pipeline & CRM',
    desc: 'Leads drop straight into a pipeline with auto-tagging and stage management. Nothing falls through the cracks.',
  },
  {
    icon: MessageSquareText,
    title: 'SMS/Email Follow-Up Sequences',
    desc: 'Automated qualification, appointment reminders, and nurture campaigns that run while you’re on the truck.',
  },
  {
    icon: CalendarClock,
    title: 'Smart Booking Calendar',
    desc: 'Integrated scheduling with confirmation and reminder automation - no more phone tag.',
  },
  {
    icon: Star,
    title: 'Review Request Automation',
    desc: 'Post-job SMS that brings in Google reviews on autopilot. Rinse and repeat reputation.',
  },
  {
    icon: Plug,
    title: 'Custom Integrations',
    desc: 'Webhooks, REST APIs, Make/Zapier - when native GHL isn’t enough, I write the code that is.',
  },
]

/* --------------------------------- Section --------------------------------- */

export default function WhatIBuild() {
  return (
    <section id="build" className="scroll-mt-16 bg-apple-surface py-[120px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <Kicker>What I build</Kicker>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-[-0.02em] text-apple-ink md:text-5xl">
            The complete <span className="text-apple-blue">lead-to-job</span> machine.
          </h2>
          <p className="mt-6 max-w-2xl text-[19px] leading-[1.5] text-apple-sub">
            Not a landing page and a prayer - a full system: front-end funnel, pricing logic, CRM
            pipeline, follow-up, booking, and reviews.
          </p>
        </Reveal>

        {/* Apple-style product card grid: 1 col mobile, 2 sm, 3 lg */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BUILD_ITEMS.map((item, i) => (
            <Reveal
              key={item.title}
              as="article"
              delay={(i % 3) * 100}
              className="card card-lift rounded-[28px] p-8 md:p-10"
            >
              <item.icon className="h-10 w-10 text-apple-blue" strokeWidth={1.5} />
              <h3 className="mt-6 text-xl font-semibold text-apple-ink">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-apple-sub">{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
