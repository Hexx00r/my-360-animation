export type ProcessStep = {
  title: 'Discover' | 'Build' | 'Deploy' | 'Support'
  description: string
}

export const processSteps: ProcessStep[] = [
  {
    title: 'Discover',
    description:
      'A short call and a written scope: what the system needs to do, which tools it touches, and what "done" looks like.',
  },
  {
    title: 'Build',
    description:
      'Typed code in small, reviewable steps, with a live preview link so you see progress as it happens.',
  },
  {
    title: 'Deploy',
    description:
      'DNS, SSL, environment secrets and Cloudflare deploys handled end to end, then tested against real submissions.',
  },
  {
    title: 'Support',
    description:
      'Handover notes, then fixes and improvements on a retainer or as needed.',
  },
]
