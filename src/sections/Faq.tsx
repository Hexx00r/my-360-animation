import { Kicker } from '@/components/Shared'
import Reveal from '@/components/Reveal'

/* ------------------------------ FAQ copy --------------------------------- */
/* Answers are drawn from the copy already on this page; keep them in sync. */

const FAQS = [
  {
    q: 'Do I need GoHighLevel already set up?',
    a: "No. I build the complete system end-to-end: the instant-quote funnel, the pricing logic behind it, the GHL pipeline and CRM, and every follow-up automation. You don't need anything in place first. And when native GHL isn't enough, I write the custom code that is.",
  },
  {
    q: 'How much does a system like this cost?',
    a: 'Every build is scoped to the business: the services you offer, your pricing logic, and the automations you need. Book a free funnel website audit and I\'ll map exactly what your system looks like before you commit to anything.',
  },
  {
    q: 'Who have you built this for?',
    a: "I built the complete GHL automation system for my own family's business, DJ Property & Cleaning Services in Albury–Wodonga, and for Melbourne High Pressure Cleaning. I learned it by building it for my own family first.",
  },
  {
    q: 'What happens to a lead after they submit a quote?',
    a: 'The lead drops straight into a GHL pipeline with auto-tagging and stage management. Nothing falls through the cracks. From there, SMS and email follow-up sequences, smart booking reminders, and post-job review requests run automatically while you\'re on the truck.',
  },
] as const

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 bg-apple-surface py-[120px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <Kicker>FAQ</Kicker>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-apple-ink md:text-5xl">
            Questions trade businesses <span className="text-apple-blue">actually ask.</span>
          </h2>
        </Reveal>
        <div className="mt-12 space-y-4">
          {FAQS.map((f, i) => (
            <Reveal as="article" key={f.q} delay={i * 80} className="card rounded-[28px] p-8">
              <h3 className="text-lg font-semibold text-apple-ink">{f.q}</h3>
              <p className="mt-3 leading-relaxed text-apple-sub">{f.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
