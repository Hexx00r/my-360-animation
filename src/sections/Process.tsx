import Section from '@/components/Section'
import Reveal from '@/components/Reveal'
import { processSteps } from '@/data/process'

export default function Process() {
  return (
    <Section id="process" kicker="Process" className="bg-black" title={<>Discover → Build → <span className="text-apple-blue">Deploy → Support.</span></>}>
      {/* Timeline: vertical on mobile, horizontal from lg up */}
      <div className="relative mt-14">
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-apple-blue via-apple-blueMist to-transparent lg:left-0 lg:right-0 lg:top-[15px] lg:h-px lg:w-auto lg:bg-gradient-to-r"
        />
        <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
        {processSteps.map((step, i) => (
          <Reveal key={step.title} as="li" delay={i * 100} className="relative pl-12 lg:pl-0 lg:pt-12">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-apple-blue bg-black text-xs font-bold text-apple-blue"
            >
              {i + 1}
            </span>
            <h3 className="text-xl font-semibold text-apple-ink">{step.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-apple-sub">{step.description}</p>
          </Reveal>
        ))}
        </ol>
      </div>
    </Section>
  )
}
