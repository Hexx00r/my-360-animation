import { ArrowUpRight } from 'lucide-react'
import Section from '@/components/Section'
import Reveal from '@/components/Reveal'
import { projects, type Project } from '@/data/projects'

function Label({ children }: { children: string }) {
  return <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-apple-blue">{children}</h4>
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const n = String(index + 1).padStart(2, '0')
  return (
    <Reveal
      as="article"
      delay={(index % 2) * 80}
      className="card flex flex-col overflow-hidden rounded-[28px]"
    >
      {project.screenshot ? (
        <img
          src={`${import.meta.env.BASE_URL}${project.screenshot.src}`}
          alt={project.screenshot.alt}
          width={project.screenshot.width}
          height={project.screenshot.height}
          loading="lazy"
          decoding="async"
          className="block aspect-[16/9] w-full border-b border-apple-hairline object-cover object-top"
        />
      ) : null}

      <div className="flex flex-1 flex-col p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-apple-sub">
          <span aria-hidden="true" className="mr-2 text-apple-blue">{n}</span>
          {project.category}
        </p>
        <h3 className="mt-3 text-xl font-semibold leading-snug text-apple-ink md:text-2xl">{project.title}</h3>

        <div className="mt-6 space-y-5 text-[15px] leading-relaxed">
          <div>
            <Label>Problem</Label>
            <p className="mt-1.5 text-apple-sub">{project.problem}</p>
          </div>
          <div>
            <Label>Stack</Label>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {project.stack.map((t) => (
                <li key={t} className="rounded-full bg-apple-blueSoft px-2.5 py-0.5 text-xs font-medium text-apple-blue">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Label>What I built</Label>
            <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-apple-sub marker:text-apple-blue">
              {project.built.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          {(project.result || project.resultImage) && (
            <div>
              <Label>Result</Label>
              <div className="mt-1.5 space-y-3">
                {project.result && <p className="text-apple-ink">{project.result}</p>}
                {project.resultImage && (
                  <img
                    src={`${import.meta.env.BASE_URL}${project.resultImage.src}`}
                    alt={project.resultImage.alt}
                    width={project.resultImage.width}
                    height={project.resultImage.height}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full rounded-2xl border border-apple-hairline"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {project.links.length > 0 && (
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-7">
            {project.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-apple-ink hover:text-apple-blue"
              >
                {l.label}
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  )
}

export default function Projects() {
  return (
    <Section
      id="projects"
      kicker="Projects"
      title={<>Case studies, <span className="text-apple-blue">problem to result.</span></>}
      intro="Each one starts with a business problem and ends with a system that runs without me."
    >
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </Section>
  )
}
