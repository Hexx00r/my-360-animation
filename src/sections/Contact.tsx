import { useState, type ChangeEvent, type FormEvent } from 'react'
import { CheckCircle2, Github, Globe, Linkedin, Mail, Youtube, type LucideIcon } from 'lucide-react'
import Section from '@/components/Section'
import Reveal from '@/components/Reveal'
import { api } from '@/api/client'
import { CONTACT_LIMITS, PROJECT_TYPES, validateContact, type ContactRequest } from '@/api/types'
import { profile, socials, type SocialLink } from '@/data/profile'

const SOCIAL_ICONS: Record<SocialLink['id'], LucideIcon> = {
  website: Globe,
  github: Github,
  linkedin: Linkedin,
  youtube: Youtube,
  email: Mail,
}

const EMPTY: ContactRequest = { name: '', email: '', projectType: PROJECT_TYPES[0], message: '', website: '' }

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string }

function ContactForm() {
  const [form, setForm] = useState<ContactRequest>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const set = (key: keyof ContactRequest) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key])
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const check = validateContact(form)
    if (!check.ok) {
      setErrors(check.fieldErrors)
      const first = Object.keys(check.fieldErrors)[0]
      document.getElementById(`contact-${first}`)?.focus()
      return
    }
    setStatus({ kind: 'sending' })
    const res = await api.contact(check.value)
    if (res.ok) {
      setStatus({ kind: 'sent' })
      setForm(EMPTY)
      return
    }
    if (res.fieldErrors) setErrors(res.fieldErrors)
    setStatus({ kind: 'error', message: res.error })
  }

  if (status.kind === 'sent') {
    return (
      <div role="status" className="card flex flex-col items-start rounded-[28px] p-8 md:p-10">
        <CheckCircle2 aria-hidden="true" className="h-10 w-10 text-apple-blue" />
        <h3 className="mt-5 text-2xl font-semibold text-apple-ink">Message sent. Thank you!</h3>
        <p className="mt-2 text-apple-sub">I&apos;ll reply personally by email.</p>
        <button type="button" onClick={() => setStatus({ kind: 'idle' })} className="btn-secondary mt-8">
          Send another
        </button>
      </div>
    )
  }

  const fieldProps = (key: keyof ContactRequest) => ({
    id: `contact-${key}`,
    name: key,
    value: form[key],
    onChange: set(key),
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `contact-${key}-error` : undefined,
  })

  const fieldError = (name: string) =>
    errors[name] ? (
      <p id={`contact-${name}-error`} className="mt-1.5 text-sm text-red-400">
        {errors[name]}
      </p>
    ) : null

  return (
    <form onSubmit={onSubmit} noValidate className="card relative rounded-[28px] p-6 md:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm font-semibold text-apple-ink">Name</label>
          <input {...fieldProps('name')} type="text" autoComplete="name" maxLength={CONTACT_LIMITS.name} required className="field mt-2" />
          {fieldError('name')}
        </div>
        <div>
          <label htmlFor="contact-email" className="text-sm font-semibold text-apple-ink">Email</label>
          <input {...fieldProps('email')} type="email" autoComplete="email" inputMode="email" maxLength={CONTACT_LIMITS.email} required className="field mt-2" />
          {fieldError('email')}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-projectType" className="text-sm font-semibold text-apple-ink">What do you need?</label>
        <select {...fieldProps('projectType')} className="field mt-2">
          {PROJECT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {fieldError('projectType')}
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className="text-sm font-semibold text-apple-ink">Project details</label>
        <textarea
          {...fieldProps('message')}
          rows={5}
          maxLength={CONTACT_LIMITS.message}
          required
          placeholder="What are you trying to build or fix? Tools you already use, timeline, budget range…"
          className="field mt-2"
        />
        {fieldError('message')}
      </div>

      {/* Honeypot: off-screen and out of the tab order. People never fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input {...fieldProps('website')} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status.kind === 'error' && (
        <p role="alert" className="mt-5 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {status.message} You can also email{' '}
          <a href={`mailto:${profile.email}`} className="font-semibold underline">{profile.email}</a>.
        </p>
      )}

      <button type="submit" disabled={status.kind === 'sending'} className="btn-primary mt-7 w-full disabled:cursor-wait disabled:opacity-60 sm:w-auto">
        {status.kind === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}

export default function Contact() {
  return (
    <Section
      id="contact"
      kicker="Contact"
      title={<>Have a project? <span className="text-apple-blue">Let&apos;s build it.</span></>}
      intro="Tell me what you need and I’ll reply personally by email."
    >
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
        <Reveal>
          <ContactForm />
        </Reveal>

        <Reveal delay={100}>
          <h3 className="text-sm font-semibold uppercase tracking-[0.05em] text-apple-sub">Elsewhere</h3>
          <ul className="mt-4 space-y-3">
            {socials.map(({ id, label, href }) => {
              const Icon = SOCIAL_ICONS[id]
              if (!href) {
                return import.meta.env.DEV ? (
                  <li key={id} className="text-sm text-yellow-300">TODO: {label} URL</li>
                ) : null
              }
              const external = !href.startsWith('mailto:')
              return (
                <li key={id}>
                  <a
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="group flex items-center gap-3 rounded-2xl border border-apple-hairline px-4 py-3 text-apple-ink transition-colors hover:border-apple-blueMist"
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 text-apple-blue" />
                    <span className="font-medium">{id === 'email' ? profile.email : label}</span>
                    {external && <span className="sr-only">(opens in a new tab)</span>}
                  </a>
                </li>
              )
            })}
          </ul>
          <p className="mt-8 text-sm leading-relaxed text-apple-sub">
            {profile.location} · {profile.availability}
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
