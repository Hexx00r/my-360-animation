import { Bot, Cloud, Code2, Server, Workflow, type LucideIcon } from 'lucide-react'
import Section from '@/components/Section'
import Reveal from '@/components/Reveal'
import { stack, type SkillGroup } from '@/data/stack'

const ICONS: Record<SkillGroup['id'], LucideIcon> = {
  frontend: Code2,
  backend: Server,
  cloud: Cloud,
  automation: Workflow,
  ai: Bot,
}

export default function Stack() {
  return (
    <Section
      id="stack"
      kicker="Stack"
      title={<>The tools behind <span className="text-apple-blue">the builds.</span></>}
      intro="Grouped by where they sit in a system, from what the visitor sees to what runs after they hit submit."
      className="bg-black"
    >
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stack.map((group, i) => {
          const Icon = ICONS[group.id]
          return (
            <Reveal key={group.id} as="article" delay={i * 60} className="card rounded-[24px] p-6 md:p-7">
              <div className="flex items-center gap-3">
                <Icon aria-hidden="true" className="h-6 w-6 text-apple-blue" strokeWidth={1.75} />
                <h3 className="text-lg font-semibold text-apple-ink">{group.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-apple-sub">{group.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${group.title} skills`}>
                {group.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-apple-hairline bg-black/30 px-3 py-1 text-sm text-apple-ink"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}
