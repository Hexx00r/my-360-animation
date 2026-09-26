import Header from '@/sections/Header'
import Hero from '@/sections/Hero'
import LatestBuild from '@/sections/LatestBuild'
import WhatIBuild from '@/sections/WhatIBuild'
import QuoteCalculatorDemo from '@/sections/QuoteCalculatorDemo'
import CaseStudyDJ from '@/sections/CaseStudyDJ'
import CaseStudyMelbourne from '@/sections/CaseStudyMelbourne'
import AutomationEngine from '@/sections/AutomationEngine'
import Projects from '@/sections/Projects'
import WhyMe from '@/sections/WhyMe'
import Faq from '@/sections/Faq'
import Footer from '@/sections/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-apple-surface">
      <Header />
      <main>
        <Hero />
        <LatestBuild />
        <WhatIBuild />
        <QuoteCalculatorDemo />
        <CaseStudyDJ />
        <CaseStudyMelbourne />
        <AutomationEngine />
        <Projects />
        <WhyMe />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
