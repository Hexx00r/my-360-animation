import portrait from '@/assets/portrait.jpg'
import { Kicker } from '@/components/Shared'
import { TechIcon } from '@/components/TechIcons'
import Reveal from '@/components/Reveal'

const GITHUB_URL = 'https://github.com/Hexx00r'

/** Quiet monochrome strip — the same tool set this section has always shown. */
const STACK = [
  'JavaScript',
  'TypeScript',
  'Python',
  'React',
  'Node.js',
  'n8n',
  'Cloudflare',
  'Make',
]

export default function WhyMe() {
  return (
    <section id="about" className="scroll-mt-16 bg-apple-surface py-[120px]">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal className="relative mx-auto w-full max-w-md">
          {/* Edge-light: faint cyan halo bleeding past the panel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-5"
            style={{
              background:
                'radial-gradient(ellipse 62% 55% at 50% 42%, rgb(0 212 255 / 0.12), transparent 70%)',
            }}
          />
          <div className="relative rounded-[28px] bg-apple-gray p-3 ring-1 ring-white/10">
            <img
              src={portrait}
              alt="Paul Sunny Isogon Jr"
              width={800}
              height={1280}
              loading="lazy"
              className="block w-full rounded-[20px] object-cover"
              style={{ filter: 'contrast(1.08) saturate(0.92) brightness(0.95)' }}
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <Kicker>Why me</Kicker>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-apple-ink md:text-5xl">
              Built for my own family first. <span className="text-apple-blue">Then for yours.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-apple-sub">
              I&apos;m <strong className="font-semibold text-apple-ink">Paul Sunny Isogon Jr</strong>. I
              built the complete GHL automation system for my own family&apos;s business DJ Property
              &amp; Cleaning Services in Albury–Wodonga, Australia. I know what it&apos;s like to miss a
              call because you&apos;re on the truck, so I design systems that work when you can&apos;t.
            </p>
            <p className="mt-4 leading-relaxed text-apple-sub">
              I don&apos;t just set up GHL, I design the entire lead-to-revenue flow: frontend funnel,
              backend automation, and pipeline logic. I learned it by building it for my own family
              first.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-10 flex items-center gap-6">
              {STACK.map((name) => (
                <TechIcon key={name} name={name} className="h-6 w-6 text-white/60" />
              ))}
            </div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-1.5 text-apple-blue transition-colors hover:text-apple-blueDark"
            >
              More on GitHub
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                className="h-3 w-3 fill-current transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M4.5 1.5 9 6l-4.5 4.5-1-1L7 6 3.5 2.5z" />
              </svg>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
