import { useMemo, useState, type FormEvent } from 'react'
import { Kicker } from '@/components/Shared'
import Reveal from '@/components/Reveal'
import { QUOTE_RELAY_ENDPOINT } from '@/site.config'

/* ------------------------- Live calculator demo ---------------------------- */

type Service = {
  id: string
  emoji: string
  name: string
  hint: string
  rate: number
  unit?: string
}

const SERVICES: Service[] = [
  { id: 'house', emoji: '🏠', name: 'House wash', hint: 'Whole exterior, flat rate', rate: 350 },
  { id: 'driveway', emoji: '🚗', name: 'Driveway & concrete', hint: '$4.50 per m²', rate: 4.5, unit: 'm²' },
  { id: 'roof', emoji: '🏘️', name: 'Roof cleaning', hint: '$10 per m²', rate: 10, unit: 'm²' },
  { id: 'brick', emoji: '🧱', name: 'Brick & block cleaning', hint: '$6 per m² · eco acid-free', rate: 6, unit: 'm²' },
  { id: 'gutter', emoji: '🍂', name: 'Gutter cleaning', hint: '$4 per linear metre', rate: 4, unit: 'linear m' },
]

const money = (n: number) => `$${Math.round(n).toLocaleString('en-AU')}`

function QuoteCalculator() {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [areas, setAreas] = useState<Record<string, string>>({})
  const [heavy, setHeavy] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('') // honeypot — must stay empty
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const calc = useMemo(() => {
    const lines = SERVICES.filter((s) => selected[s.id]).map((s) => {
      const qty = s.unit ? Math.max(0, Number(areas[s.id]) || 0) : 1
      return { ...s, qty, total: s.unit ? s.rate * qty : s.rate, tbc: Boolean(s.unit) && qty === 0 }
    })
    const subtotal = lines.reduce((sum, l) => sum + l.total, 0)
    const heavyAdj = heavy ? subtotal * 0.2 : 0
    const afterHeavy = subtotal + heavyAdj
    const validLines = lines.filter((l) => !l.tbc)
    const bundle = validLines.length >= 2 ? afterHeavy * 0.2 : 0
    const beforeMin = afterHeavy - bundle
    const minApplied = beforeMin > 0 && beforeMin < 150
    const total = minApplied ? 150 : beforeMin
    return { lines, subtotal, heavyAdj, bundle, total, minApplied }
  }, [selected, areas, heavy])

  const hasTbc = calc.lines.some((l) => l.tbc)
  const canSubmit = calc.lines.length > 0 && !hasTbc && !sending

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    setSending(true)
    setError('')

    const details: Record<string, string> = {}
    for (const l of calc.lines) {
      details[l.name] = l.unit ? `${l.qty} ${l.unit}` : 'flat rate'
    }
    details['Condition'] = heavy ? 'Heavy staining (+20%)' : 'Normal build-up'

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      service: calc.lines.map((l) => l.name).join(' + '),
      message: message.trim() || undefined,
      timestamp: new Date().toISOString(),
      estimate: Math.round(calc.total),
      details,
      bundleDiscount: calc.bundle > 0,
      company, // honeypot — bots fill it, humans never see it
    }

    try {
      const res = await fetch(QUOTE_RELAY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      window.location.href = `${import.meta.env.BASE_URL}booked.html`
    } catch {
      setError("Couldn't send your quote just now — call or text 0450 710 483 and we'll lock it in.")
      setSending(false)
    }
  }

  return (
    <div className="card rounded-[28px] p-8 md:p-10">
      <p className="text-[15px] leading-relaxed text-apple-sub">
        Same pricing logic I wire into client funnels. Tick services, type an area, watch the
        estimate update.
      </p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-apple-blueSoft px-4 py-1.5 text-xs font-medium text-apple-blue">
        ⏱ Booking up fast - spring wash season is our busiest time
      </p>

      {/* service picker */}
      <div className="mt-8">
        <p className="text-sm font-semibold text-apple-ink">
          What needs doing? <span className="font-normal text-apple-sub">(tick all that apply)</span>
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SERVICES.map((s) => {
            const on = Boolean(selected[s.id])
            return (
              <div
                key={s.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  on ? 'border-apple-blue bg-apple-blueSoft' : 'border-apple-hairline bg-apple-surface hover:border-apple-blueMist'
                }`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setSelected((p) => ({ ...p, [s.id]: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-apple-blue"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-apple-ink">
                      {s.emoji} {s.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-apple-sub">{s.hint}</span>
                  </span>
                </label>
                {on && s.unit && (
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder={`Approx. area (${s.unit})`}
                    value={areas[s.id] ?? ''}
                    onChange={(e) => setAreas((p) => ({ ...p, [s.id]: e.target.value }))}
                    className="mt-3 w-full rounded-xl border border-apple-hairline bg-black/40 px-3 py-2 text-sm text-apple-ink placeholder:text-apple-sub focus:border-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue"
                    aria-label={`${s.name} area in ${s.unit}`}
                  />
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-sm font-semibold text-apple-ink">How dirty is it?</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(['Normal build-up', 'Heavy staining'] as const).map((label, i) => {
            const active = heavy === (i === 1)
            return (
              <button
                key={label}
                type="button"
                onClick={() => setHeavy(i === 1)}
                className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-apple-blue bg-apple-blueSoft text-apple-blue'
                    : 'border-apple-hairline bg-apple-surface text-apple-sub hover:border-apple-blueMist'
                }`}
                aria-pressed={active}
              >
                {label}
                {i === 1 && <span className="ml-1 text-xs font-medium">(+20%)</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* instant estimate panel */}
      <div className="mt-8 rounded-[20px] border border-apple-hairline bg-black/40 p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.25em] text-apple-blue">
          INSTANT ESTIMATE
        </p>
        <p className="mt-2 text-3xl font-bold tracking-[-0.02em] text-apple-blue">
          {calc.lines.length ? `${money(calc.total)}${calc.lines.some((l) => l.tbc) ? '+' : ''}` : '$0'}
        </p>

        <ul className="mt-6 space-y-3 border-t border-apple-borderSoft pt-6 text-sm">
          {calc.lines.length === 0 && (
            <li className="text-apple-sub">Pick a service to see the ballpark.</li>
          )}
          {calc.lines.map((l) => (
            <li key={l.id} className="flex items-baseline justify-between gap-3">
              <span className="text-apple-sub">
                {l.name}
                {l.unit ? ` (${l.qty} ${l.unit})` : ''}
              </span>
              <span className="font-semibold text-apple-ink">{l.tbc ? 'TBC' : money(l.total)}</span>
            </li>
          ))}
          {heavy && calc.lines.length > 0 && (
            <li className="flex items-baseline justify-between gap-3 text-apple-sub">
              <span>Heavy staining (+20%)</span>
              <span className="font-semibold text-apple-ink">+{money(calc.heavyAdj)}</span>
            </li>
          )}
          {calc.bundle > 0 && (
            <li className="flex items-baseline justify-between gap-3 text-apple-blue">
              <span>Bundle discount (2+ services, −20%)</span>
              <span className="font-semibold">−{money(calc.bundle)}</span>
            </li>
          )}
          {calc.minApplied && (
            <li className="text-apple-sub">Minimum job $150 applied.</li>
          )}
        </ul>

        <p className="mt-6 border-t border-apple-borderSoft pt-4 text-xs leading-relaxed text-apple-sub">
          Ballpark only - the fixed quote is confirmed within one business day. Bundle 2+ services
          and save 20%. Minimum job $150.
        </p>
      </div>

      {/* quote request form */}
      <form onSubmit={handleSubmit} className="mt-8 rounded-[20px] border border-apple-hairline p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.25em] text-apple-blue">GET YOUR FIXED QUOTE</p>
        <p className="mt-2 text-sm leading-relaxed text-apple-sub">
          Happy with the ballpark? Send it through — the fixed quote is confirmed within one
          business day.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-apple-hairline bg-black/40 px-3 py-2 text-sm text-apple-ink placeholder:text-apple-sub focus:border-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue"
          />
          <input
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-apple-hairline bg-black/40 px-3 py-2 text-sm text-apple-ink placeholder:text-apple-sub focus:border-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue"
          />
        </div>
        <textarea
          name="message"
          rows={3}
          placeholder="Anything else? Gate access, pets, timing… (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-3 w-full rounded-xl border border-apple-hairline bg-black/40 px-3 py-2 text-sm text-apple-ink placeholder:text-apple-sub focus:border-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue"
        />
        {/* honeypot — hidden from users, bots fill it and get silently dropped */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full rounded-full bg-apple-blueSolid py-3 text-sm font-semibold text-black transition-all hover:bg-apple-blueDark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending
            ? 'Sending…'
            : calc.lines.length && !hasTbc
              ? `Send quote request · ${money(calc.total)}`
              : 'Send quote request'}
        </button>
        {calc.lines.length === 0 && (
          <p className="mt-2 text-center text-xs text-apple-sub">Tick at least one service above first.</p>
        )}
        {calc.lines.length > 0 && hasTbc && (
          <p className="mt-2 text-center text-xs text-apple-sub">Add an approximate area for the per-m² services to send.</p>
        )}
      </form>
    </div>
  )
}

/* --------------------------------- Section --------------------------------- */

export default function QuoteCalculatorDemo() {
  return (
    <section id="calculator" className="scroll-mt-16 bg-apple-surface py-[120px]">
      <div className="mx-auto max-w-[680px] px-6">
        <Reveal className="text-center">
          <Kicker>Try the calculator</Kicker>
        </Reveal>

        <Reveal delay={100} y={32} className="mt-10">
          <QuoteCalculator />
        </Reveal>
      </div>
    </section>
  )
}
