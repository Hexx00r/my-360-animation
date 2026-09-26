import { useEffect, useState } from 'react'
import { Code2, Menu, X } from 'lucide-react'
import { profile } from '@/data/profile'

const NAV: { label: string; href: string; chat?: boolean }[] = [
  { label: 'About', href: '#about' },
  { label: 'Stack', href: '#stack' },
  { label: 'Projects', href: '#projects' },
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Chat', href: '#chat', chat: true },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={`sticky top-0 z-50 overflow-hidden transition-all duration-300 ${
          scrolled
            ? 'border-b border-apple-glassLine backdrop-blur-[20px]'
            : 'border-b border-transparent'
        }`}
        style={{ backgroundColor: scrolled ? 'rgba(10,10,10,0.7)' : 'transparent' }}
      >
        <div className="relative z-10 flex h-12 items-center justify-between gap-4 px-5">
          <a href="#top" className="flex items-center gap-2 text-apple-ink" aria-label={`${profile.shortName}, back to top`}>
            <Code2 aria-hidden="true" className="h-5 w-5 text-apple-blue" strokeWidth={2.5} />
            <span className="hidden text-sm font-semibold tracking-tight sm:block">
              {profile.shortName}
            </span>
          </a>

          {/* Right cluster: nav beside the CTA so the bar's center stays
              clear; CTA + hamburger only on mobile (≤768px) */}
          <div className="flex items-center gap-3 md:gap-8">
            <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  data-pdc-chat={item.chat ? '' : undefined}
                  className="text-xs font-normal text-apple-ink opacity-70 transition-opacity duration-300 hover:opacity-100"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <a
              href="#contact"
              className="inline-flex rounded-full bg-apple-blueSolid px-4 py-2 text-xs font-semibold text-black transition-all duration-300 hover:bg-apple-blueDark"
            >
              Hire Me
            </a>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-controls="mobile-menu"
              className="inline-flex h-11 w-11 items-center justify-center text-apple-ink opacity-80 md:hidden"
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — sibling of header (not inside the backdrop-filter
          context, which would trap position:fixed to the header's box) */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`fixed inset-x-0 top-12 bottom-0 z-40 border-apple-glassLine backdrop-blur-xl transition-[opacity,transform] duration-300 md:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
        style={{ backgroundColor: 'rgba(10,10,10,0.92)' }}
      >
        <nav className="flex flex-col gap-1 px-6 pt-6" aria-label="Mobile">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-pdc-chat={item.chat ? '' : undefined}
              onClick={() => setOpen(false)}
              className="border-b border-apple-borderSoft py-4 text-2xl font-semibold tracking-tight text-apple-ink"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-apple-blueSolid px-6 py-3 text-base font-semibold text-black transition-all duration-300 hover:bg-apple-blueDark"
          >
            Hire Me
          </a>
        </nav>
      </div>
    </>
  )
}
