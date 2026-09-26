import { lazy, Suspense } from 'react'
import Header from '@/sections/Header'
import Hero from '@/sections/Hero'
import About from '@/sections/About'
import Stack from '@/sections/Stack'
import Projects from '@/sections/Projects'
import QuoteCalculatorDemo from '@/sections/QuoteCalculatorDemo'
import Services from '@/sections/Services'
import Process from '@/sections/Process'
import Contact from '@/sections/Contact'
import Footer from '@/sections/Footer'

// Chat is client-only and off the critical path: its chunk loads after first paint.
const ChatWidget = lazy(() => import('@/components/ChatWidget'))

export default function Home() {
  return (
    <div className="min-h-screen bg-apple-surface">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Stack />
        <Projects />
        <QuoteCalculatorDemo />
        <Services />
        <Process />
        <Contact />
      </main>
      <Footer />
      {/* Client only: the prerender (renderToString) skips the chat entirely */}
      {typeof window !== 'undefined' && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
    </div>
  )
}
