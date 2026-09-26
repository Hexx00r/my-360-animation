import { Fragment } from 'react'
import {
  Bell,
  CalendarCheck,
  FileText,
  MessagesSquare,
  Sprout,
  Star,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import { BrowserShot, Kicker } from '@/components/Shared'
import Reveal from '@/components/Reveal'
import wfQuote from '@/assets/wf-quote.webp'
import wfFollowup from '@/assets/wf-followup.webp'
import wfReview from '@/assets/wf-review.webp'

/** One turn of the machine: every lead travels this loop unattended */
const NODES: { label: string; icon: LucideIcon }[] = [
  { label: 'New Quote', icon: FileText },
  { label: 'Tag', icon: Tag },
  { label: 'Notify', icon: Bell },
  { label: 'Follow-Up', icon: MessagesSquare },
  { label: 'Book', icon: CalendarCheck },
  { label: 'Review', icon: Star },
  { label: 'Nurture', icon: Sprout },
]

function Node({ node, index }: { node: (typeof NODES)[number]; index: number }) {
  const Icon = node.icon
  return (
    <li
      className="node-pulse inline-flex shrink-0 items-center gap-2 rounded-full border border-apple-hairline bg-apple-gray px-4 py-2.5 text-sm font-medium text-apple-ink"
      style={{ animationDelay: `${index * 0.22}s` }}
    >
      <Icon className="h-4 w-4 text-apple-blue" strokeWidth={1.5} aria-hidden="true" />
      {node.label}
    </li>
  )
}

/** Thin horizontal connector with an arrowhead, stretching between two nodes */
function HConnector() {
  return (
    <li aria-hidden="true" className="mx-1 flex min-w-2 flex-1 items-center">
      <span className="relative h-px w-full bg-apple-hairline">
        <span className="absolute -right-[1px] -top-[2px] h-[5px] w-[5px] rotate-45 border-r border-t border-apple-hairline" />
      </span>
    </li>
  )
}

/** Vertical connector aligned with the icon inside the pills above/below */
function VConnector() {
  return (
    <li aria-hidden="true" className="ml-[23px] flex h-5 items-center">
      <span className="relative h-full w-px bg-apple-hairline">
        <span className="absolute -bottom-[1px] -left-[2px] h-[5px] w-[5px] rotate-45 border-b border-r border-apple-hairline" />
      </span>
    </li>
  )
}

export default function AutomationEngine() {
  return (
    <section id="automations" className="scroll-mt-16 bg-apple-surface py-[120px]">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <Kicker>The automation engine</Kicker>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.02em] text-apple-ink md:text-5xl">
            The real magic happens <span className="text-apple-blue">behind the scenes.</span>
          </h2>
          <p className="mt-6 max-w-3xl text-[19px] leading-[1.5] text-apple-sub">
            Most &ldquo;funnel builders&rdquo; give you a landing page and disappear. I architect
            the entire automation backbone -{' '}
            <strong className="font-semibold text-apple-ink">6+ interconnected workflows</strong>{' '}
            handling every stage from first click to 5-star review. This is what turns a website
            into a revenue machine.
          </p>
        </Reveal>

        {/* Flow diagram — Apple chip-architecture style */}
        <Reveal delay={120} className="mt-14">
          <div className="relative overflow-hidden rounded-[28px] border border-apple-hairline bg-apple-invert p-6 md:p-10">
            {/* Faint cyan substrate glow, fading to black at the edges */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 55% 65% at 50% 0%, rgb(0 212 255 / 0.05), transparent 70%)',
              }}
            />

            {/* Desktop: one horizontal row of connected nodes */}
            <ol className="relative hidden items-center lg:flex">
              {NODES.map((node, i) => (
                <Fragment key={node.label}>
                  {i > 0 && <HConnector />}
                  <Node node={node} index={i} />
                </Fragment>
              ))}
            </ol>

            {/* Mobile / tablet: vertical stack with the line down the left */}
            <ol className="relative flex flex-col items-start lg:hidden">
              {NODES.map((node, i) => (
                <Fragment key={node.label}>
                  {i > 0 && <VConnector />}
                  <Node node={node} index={i} />
                </Fragment>
              ))}
            </ol>

            <p className="relative mt-6 text-center text-xs text-apple-sub lg:mt-8">
              From first click to 5-star review - every stage fires without you touching it.
            </p>
          </div>
        </Reveal>

        {/* Supporting evidence: the actual workflow screenshots */}
        <div className="mx-auto mt-12 grid max-w-[1200px] grid-cols-2 gap-4 md:mt-16 md:gap-5 lg:grid-cols-3">
          <Reveal as="div">
            <BrowserShot
              src={wfQuote}
              alt="Workflow 01 - inbound webhook to contact, tags, opportunity and internal notification"
              url="01 · New quote submitted"
              width={1076}
              height={976}
            />
          </Reveal>
          <Reveal as="div" delay={100}>
            <BrowserShot
              src={wfFollowup}
              alt="Workflow 02 - quoted follow-up sequence with waits, conditions and last-call step"
              url="02 · Quoted follow-up"
              width={942}
              height={881}
            />
          </Reveal>
          <Reveal as="div" delay={200}>
            <BrowserShot
              src={wfReview}
              alt="Workflow 05 - Google review follow-up with 3-day wait and pipeline condition"
              url="05 · Review follow-up"
              width={1111}
              height={977}
            />
          </Reveal>
        </div>
        <p className="mx-auto mt-5 max-w-[1200px] text-center text-xs text-apple-sub">
          Actual workflow screenshots from the DJ Property &amp; Cleaning sub-account - published
          and enrolling real leads.
        </p>
      </div>
    </section>
  )
}
