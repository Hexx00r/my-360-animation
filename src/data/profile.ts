/**
 * Who I am and where to reach me. Shared by the page and the chat Worker, so
 * keep this file free of Vite-only APIs (no import.meta.env, no asset imports).
 */

export type SocialLink = {
  id: 'website' | 'github' | 'linkedin' | 'youtube' | 'email'
  label: string
  /** Empty string = not set yet; the UI renders it as a TODO, not a dead link. */
  href: string
}

export const profile = {
  name: 'Paul Sunny Isogon Jr',
  shortName: 'Paul Isogon',
  role: 'Full-Stack Web Developer',
  location: 'Philippines',
  availability: 'Remote · working with AU, US and global clients',
  valueProp:
    'I build fast websites, the APIs behind them, and the automations and AI that keep the business running.',
  email: 'paulsunnyisogon@gmail.com',
  siteUrl: 'https://paulsunnydev.com',
  bio: [
    "I'm Paul, a full-stack web developer based in the Philippines and working remotely with clients in Australia, the US and beyond.",
    'I work across the whole path a lead takes: the frontend a visitor lands on, the API or edge Worker that receives the form, the CRM and automation that follows up, and the AI layer that answers questions when nobody is at a desk.',
  ],
} as const

export const socials: SocialLink[] = [
  { id: 'website', label: 'paulsunnydev.com', href: 'https://www.paulsunnydev.com' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/Hexx00r' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/paul-sunny-isogon-jr-394656255/' },
  { id: 'youtube', label: 'YouTube', href: 'https://youtu.be/BoxC1hGvrZo' },
  { id: 'email', label: 'Email', href: `mailto:${profile.email}` },
]
