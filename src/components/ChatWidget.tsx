/**
 * Site chat. Talks to the Worker's /api/chat through the typed client; the
 * Worker holds the TypeSafe key. Lazy-loaded after first paint (see Home).
 *
 * Mobile (<640px): bottom sheet with a dimmed backdrop and swipe-down to
 * close. Any element with [data-pdc-chat] opens the panel instead of navigating.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent, type TouchEvent } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { api } from '@/api/client'
import { CHAT_MAX_HISTORY, CHAT_MAX_MESSAGE, type ChatResponse, type ChatTurn } from '@/api/types'

type Message = ChatTurn & { id: number; cta?: ChatResponse['cta']; pending?: boolean }

const GREETING =
  'Hi! Ask me what Paul builds, about a past project, his stack, or whether he can help with your idea.'
const STARTERS = ['What do you build?', 'Can you connect my website form to a CRM?', 'Show me a project']

function sessionId(): string {
  const make = () =>
    (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9-]/g, '-').slice(0, 36)
  try {
    let sid = localStorage.getItem('pdc-session')
    if (!sid || !/^[A-Za-z0-9-]{8,64}$/.test(sid)) {
      sid = make()
      localStorage.setItem('pdc-session', sid)
    }
    return sid
  } catch {
    return make() // storage blocked (private mode etc.)
  }
}

let nextId = 1

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', text: GREETING }])
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragY, setDragY] = useState(0)

  const sid = useRef<string>('')
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const dragStart = useRef<number | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    launcherRef.current?.focus()
  }, [])

  // [data-pdc-chat] links anywhere on the page open the panel
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-pdc-chat]')
      if (!el) return
      e.preventDefault()
      setOpen(true)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages])

  async function send(text: string) {
    const message = text.trim().slice(0, CHAT_MAX_MESSAGE)
    if (!message || busy) return
    sid.current ||= sessionId()

    const history: ChatTurn[] = messages
      .filter((m) => !m.pending && m.id !== 0)
      .slice(-CHAT_MAX_HISTORY)
      .map(({ role, text }) => ({ role, text }))
    const pendingId = nextId++
    setMessages((m) => [
      ...m,
      { id: nextId++, role: 'user', text: message },
      { id: pendingId, role: 'assistant', text: '…', pending: true },
    ])
    setInput('')
    setSuggestions([])
    setBusy(true)

    const res = await api.chat({ message, sessionId: sid.current, history })
    setMessages((m) =>
      m.map((msg) =>
        msg.id === pendingId
          ? res.ok
            ? { id: pendingId, role: 'assistant', text: res.reply, cta: res.cta }
            : { id: pendingId, role: 'assistant', text: res.error }
          : msg,
      ),
    )
    if (res.ok) setSuggestions(res.suggestions)
    setBusy(false)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  // Swipe-down on the sheet header closes it (mobile pattern)
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) dragStart.current = e.touches[0].clientY
  }
  const onTouchMove = (e: TouchEvent) => {
    if (dragStart.current !== null) setDragY(Math.max(0, e.touches[0].clientY - dragStart.current))
  }
  const onTouchEnd = () => {
    if (dragY > 60) close()
    dragStart.current = null
    setDragY(0)
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        aria-controls="site-chat"
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-[calc(16px+env(safe-area-inset-right,0px))] z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-apple-blueSolid text-black shadow-[0_8px_30px_rgba(0,212,255,0.35)] transition-transform hover:scale-105 sm:bottom-5 sm:right-5 sm:h-14 sm:w-14"
      >
        {open ? <X aria-hidden="true" className="h-6 w-6" /> : <MessageCircle aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />}
      </button>

      {open && (
        <div aria-hidden="true" onClick={close} className="fixed inset-0 z-[59] bg-black/45 sm:hidden" />
      )}

      <div
        id="site-chat"
        role="dialog"
        aria-label="Chat with Paul's assistant"
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        className={`${open ? 'flex' : 'hidden'} fixed inset-x-[4vw] bottom-0 z-[60] max-h-[75dvh] flex-col overflow-hidden rounded-t-2xl border border-apple-hairline bg-apple-gray shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-transform sm:inset-x-auto sm:bottom-[88px] sm:right-5 sm:max-h-[70vh] sm:w-[360px] sm:rounded-2xl`}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="flex items-center justify-between gap-2 border-b border-apple-hairline bg-white/[0.03] px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-apple-ink">Ask about Paul&apos;s work</p>
            <p className="text-xs text-apple-sub">Answers come from this site&apos;s content</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close chat"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-apple-sub hover:text-apple-ink sm:h-8 sm:w-8"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-busy={busy}
          className="flex min-h-[180px] flex-1 flex-col gap-2 overflow-y-auto p-3"
        >
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
              <p
                className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-[14px] leading-[1.45] ${
                  m.role === 'user'
                    ? 'rounded-br-sm bg-apple-blueSolid text-black'
                    : 'rounded-bl-sm bg-white/[0.06] text-apple-ink'
                } ${m.pending ? 'animate-pulse' : ''}`}
              >
                {m.role === 'user' && <span className="sr-only">You: </span>}
                {m.text}
              </p>
              {m.cta && (
                <a
                  href={m.cta.href}
                  onClick={close}
                  className="mt-2 inline-flex rounded-full border border-apple-blueMist px-3 py-1.5 text-xs font-semibold text-apple-blue hover:bg-apple-blueSoft"
                >
                  {m.cta.label} →
                </a>
              )}
            </div>
          ))}
        </div>

        {suggestions.length > 0 && !busy && (
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="rounded-full border border-apple-hairline px-3 py-1.5 text-xs text-apple-ink hover:border-apple-blueMist"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-2 border-t border-apple-hairline p-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] sm:pb-3">
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <input
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={CHAT_MAX_MESSAGE}
            placeholder="Type a message…"
            autoComplete="off"
            className="field flex-1 py-2 text-base sm:text-sm"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-apple-blueSolid px-4 text-sm font-semibold text-black disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </>
  )
}
