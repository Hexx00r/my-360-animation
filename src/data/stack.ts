/** Grouped skill grid. `id` is a stable key the chat Worker uses for routing. */

export type SkillGroup = {
  id: 'frontend' | 'backend' | 'cloud' | 'automation' | 'ai'
  title: string
  /** One line the chat uses when someone asks about this area. */
  summary: string
  skills: string[]
}

export const stack: SkillGroup[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    summary: 'Fast, accessible, prerendered frontends in typed React or plain HTML/CSS/JS.',
    skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vite', 'GSAP'],
  },
  {
    id: 'backend',
    title: 'Backend',
    summary: 'APIs, webhooks and server logic that connect forms, CRMs and third-party services.',
    skills: ['Node.js', 'REST APIs', 'Webhooks', 'Python', 'Java'],
  },
  {
    id: 'cloud',
    title: 'Cloud / DevOps',
    summary: 'Edge hosting and deploy pipelines on Cloudflare, with Git-based CI and containers.',
    skills: ['Cloudflare Workers', 'Cloudflare Pages', 'DNS / SSL', 'Wrangler', 'Git / GitHub', 'Docker'],
  },
  {
    id: 'automation',
    title: 'Data / CRM / Automation',
    summary: 'CRM pipelines and workflow automation that follow up on every lead.',
    skills: ['GoHighLevel', 'Zoho CRM', 'n8n', 'Zapier', 'Make'],
  },
  {
    id: 'ai',
    title: 'AI',
    summary: 'AI chat agents, enquiry classifiers and AI receptionists wired into real workflows.',
    skills: ['LLM integrations', 'AI chat agents', 'AI receptionists'],
  },
]
