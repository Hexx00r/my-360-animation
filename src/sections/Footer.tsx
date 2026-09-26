import { Droplet } from 'lucide-react'
import { BOOKING, MAILTO, RESUME, YOUTUBE } from '@/components/Shared'

const GITHUB_URL = 'https://github.com/Hexx00r'

const COLUMNS: {
  title: string
  links: { label: string; href: string; external?: boolean; download?: boolean; chat?: boolean }[]
}[] = [
  {
    title: 'Explore',
    links: [
      { label: 'What I Build', href: '#build' },
      { label: 'Case Study: DJ Property', href: '#case-study-dj' },
      { label: 'Case Study: Melbourne HPC', href: '#case-study-melbourne' },
      { label: 'The Automation Engine', href: '#automations' },
      { label: 'About', href: '#about' },
    ],
  },
  {
    title: 'Work with me',
    links: [
      { label: 'Book a Call', href: BOOKING, external: true },
      { label: 'Chat', href: '#chat', chat: true },
      { label: 'Email', href: MAILTO },
      { label: 'Resume', href: RESUME, download: true },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'GitHub', href: GITHUB_URL, external: true },
      { label: 'YouTube', href: YOUTUBE, external: true },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-apple-surface py-10">
      <div className="mx-auto max-w-6xl px-6">
        <a href="#top" className="flex items-center gap-2 text-apple-ink" aria-label="Home">
          <Droplet className="h-5 w-5 text-apple-blue" strokeWidth={2.5} />
          <span className="text-sm font-semibold tracking-tight">Paul Isogon</span>
        </a>

        <nav className="mt-10 grid gap-8 sm:grid-cols-3" aria-label="Footer">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-apple-ink">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      download={link.download || undefined}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      data-pdc-chat={link.chat ? '' : undefined}
                      className="text-xs text-apple-sub transition-colors hover:text-apple-ink"
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
          © {new Date().getFullYear()} Paul Sunny Isogon Jr
        </p>
      </div>
    </footer>
  )
}
