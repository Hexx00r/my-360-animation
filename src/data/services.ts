/** What I sell. `id` is a stable key the chat Worker uses for routing. */

export type Service = {
  id: 'websites' | 'integrations' | 'crm-automation' | 'ai-agents' | 'retainer'
  title: string
  /** Card copy — also the chat's answer when a visitor asks about this service. */
  description: string
  /** Concrete examples; the chat Worker passes these to the model as matching hints. */
  examples: string[]
}

export const services: Service[] = [
  {
    id: 'websites',
    title: 'Custom websites & web apps',
    description:
      'Hand-built, prerendered sites and small web apps in React/TypeScript, fast on mobile and hosted on Cloudflare for next to nothing.',
    examples: ['business website', 'landing page', 'portfolio', 'web app', 'redesign', 'quote calculator', 'booking page'],
  },
  {
    id: 'integrations',
    title: 'API & integration work',
    description:
      'REST APIs, webhooks and edge Workers that move data between your forms, CRM, payment and messaging tools, with validation and logging built in.',
    examples: ['webhook', 'API', 'connect two tools', 'Cloudflare Worker', 'form to CRM', 'data sync', 'proxy'],
  },
  {
    id: 'crm-automation',
    title: 'CRM & automation builds',
    description:
      'GoHighLevel and Zoho CRM pipelines, n8n, Zapier and Make workflows, so every lead is tagged, followed up and booked without manual work.',
    examples: ['GoHighLevel', 'GHL', 'Zoho', 'n8n', 'Zapier', 'Make', 'pipeline', 'follow-up sequence', 'SMS/email automation'],
  },
  {
    id: 'ai-agents',
    title: 'AI chat & voice agents',
    description:
      'Website chat agents, enquiry classifiers and AI receptionists that answer questions, qualify leads and hand off to a human.',
    examples: ['chatbot', 'AI chat', 'AI receptionist', 'voice agent', 'lead qualification', 'LLM', 'classify enquiries'],
  },
  {
    id: 'retainer',
    title: 'Ongoing retainers',
    description:
      'Monthly support after launch: fixes, small features, monitoring, content updates and automation tweaks.',
    examples: ['maintenance', 'monthly support', 'updates', 'monitoring', 'ongoing help'],
  },
]
