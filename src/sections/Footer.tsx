import { Code2 } from 'lucide-react'
import { RESUME } from '@/components/Shared'
import { profile, socials } from '@/data/profile'

const COLUMNS: {
  title: string
  links: { label: string; href: string; external?: boolean; download?: boolean; chat?: boolean }[]
}[] = [
  {
    title: 'Explore',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Stack', href: '#stack' },
      { label: 'Projects', href: '#projects' },
      { label: 'Services', href: '#services' },
      { label: 'Process', href: '#process' },
    ],
  },
  {
    title: 'Work with me',
    links: [
      { label: 'Contact form', href: '#contact' },
      { label: 'Chat', href: '#chat', chat: true },
      { label: 'Resume (PDF)', href: RESUME, download: true },
    ],
  },
  {
    title: 'Connect',
    links: socials
      .filter((s) => s.href && s.id !== 'email')
      .map((s) => ({ label: s.label, href: s.href, external: true })),
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-apple-hairline bg-apple-surface py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 text-apple-ink" aria-label={`${profile.shortName}, back to top`}>
          <Code2 aria-hidden="true" className="h-5 w-5 text-apple-blue" strokeWidth={2.5} />
          <span className="text-sm font-semibold tracking-tight">{profile.shortName}</span>
        </a>

        <nav className="mt-10 grid gap-8 sm:grid-cols-3" aria-label="Footer">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-apple-ink">{col.title}</h2>
              <ul className="mt-3 space-y-1">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      download={link.download || undefined}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      data-pdc-chat={link.chat ? '' : undefined}
                      className="inline-block py-1.5 text-sm text-apple-sub transition-colors hover:text-apple-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <p className="mt-10 border-t border-apple-hairline pt-6 text-xs text-apple-sub">
          © {new Date().getFullYear()} {profile.name} · {profile.role}
        </p>
      </div>
    </footer>
  )
}
