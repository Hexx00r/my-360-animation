/**
 * POST /api/chat — answers questions about Paul's work.
 *
 * TypeSafe's Jev returns typed judgments, not prose. One parallel request asks
 * what the visitor wants (intent), which service / project / skill it touches,
 * and whether they sound like a potential client. Code then composes the reply
 * from src/data — the same content the page renders — so the chat can't invent
 * services, prices or results.
 */
import type { ChatIntent, ChatRequest, ChatResponse } from '../../src/api/types'
import { profile } from '../../src/data/profile'
import { processSteps } from '../../src/data/process'
import { projects, type Project } from '../../src/data/projects'
import { services, type Service } from '../../src/data/services'
import { stack, type SkillGroup } from '../../src/data/stack'
import { systemOne, type ChoiceAnswer, type ChoiceQuestion, type NoulQuestion } from './typesafe'

/* ------------------------------- Thresholds -------------------------------- */
// Starting points, not universal truths — tune against real chat logs.
const MIN_INTENT_CONFIDENCE = 0.35
const MIN_OPTION_PROBABILITY = 0.4
const HIRE_NUDGE = 0.6

const CONTACT_CTA = { label: 'Tell Paul about your project', href: '#contact' }
const DEFAULT_SUGGESTIONS = ['What do you build?', 'Show me a project', 'Can you help with a CRM automation?']

/* ------------------------------ Skill lookup ------------------------------- */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

const SKILLS = stack.flatMap((group) => group.skills.map((name) => ({ key: slug(name), name, group })))
const skillByKey = new Map(SKILLS.map((s) => [s.key, s]))

/* -------------------------------- Questions -------------------------------- */

const CONTEXT_NOTE =
  '`visitor_message` is the newest message typed into the chat on Paul’s developer portfolio. Use `recent_conversation` only to resolve short follow-ups such as “how much?” or “yes, that one”.'

const intentCriteria: Record<Exclude<ChatIntent, 'unclear'>, string> = {
  services_overview: 'A general question about what Paul builds, offers or does, without naming a specific task.',
  can_you_help:
    'Asks whether Paul can build, fix, set up or help with a specific thing: a type of site, an integration, a CRM, an automation, a bot, etc.',
  project_question: 'Asks about Paul’s past work, portfolio pieces, case studies or examples.',
  stack_question: 'Asks which languages, frameworks, platforms or tools Paul knows or uses.',
  pricing: 'Asks about cost, rates, quotes, budget or payment.',
  process_availability:
    'Asks how working together goes: process, timelines, availability, time zone, location, communication or remote work.',
  hire_contact: 'Wants to hire Paul, start a project, book a call, or asks how to contact him.',
  greeting: 'Only a greeting, thanks, or small talk, with no question about Paul’s work.',
  off_topic: 'Unrelated to Paul, his services or web development work.',
}

function buildQuestions() {
  const intent: ChoiceQuestion<keyof typeof intentCriteria> = {
    type: 'choice',
    instructions: `${CONTEXT_NOTE} What is the visitor mainly asking for in \`visitor_message\`?`,
    criteria: intentCriteria,
  }

  const service: ChoiceQuestion = {
    type: 'choice',
    instructions: `${CONTEXT_NOTE} Which one of Paul’s \`services\` best covers the need or topic in \`visitor_message\`? Choose "none" if no service covers it or the message is not about a need.`,
    criteria: {
      ...Object.fromEntries(services.map((s) => [s.id, `${s.title}. Covers things like: ${s.examples.join(', ')}.`])),
      none: 'No listed service covers it, or the message is not about a need.',
    },
  }

  const project: ChoiceQuestion = {
    type: 'choice',
    instructions: `${CONTEXT_NOTE} Which one of Paul’s \`projects\` does \`visitor_message\` ask about or relate to most closely? Choose "none" if it does not concern any specific project.`,
    criteria: {
      ...Object.fromEntries(projects.map((p) => [p.id, `${p.title} (${p.category}).`])),
      none: 'The message does not concern any specific project.',
    },
  }

  const skill: ChoiceQuestion = {
    type: 'choice',
    instructions: `${CONTEXT_NOTE} Does \`visitor_message\` name a specific technology, language, platform or tool? If it names one that appears in \`skills\`, pick it (treat common aliases as the same tool, e.g. "GHL" = GoHighLevel, "Node" = Node.js). If it names one that is not listed, pick "unlisted". If it names none, pick "none".`,
    criteria: {
      ...Object.fromEntries(SKILLS.map((s) => [s.key, `${s.name} (${s.group.title})`])),
      unlisted: 'Names a specific technology or tool that is not in the list.',
      none: 'Does not name any specific technology or tool.',
    },
  }

  const wantsToHire: NoulQuestion = {
    type: 'noul',
    instructions: `${CONTEXT_NOTE} Across \`visitor_message\` and \`recent_conversation\`, is the visitor describing a real project, need or problem of their own that they want built, fixed or handled?`,
    criteria: {
      true: 'They describe their own project, business need or problem, or say they want to start or hire.',
      false: 'They are only browsing, asking general questions, or making small talk.',
    },
  }

  return { intent, service, project, skill, wants_to_hire: wantsToHire }
}

const QUESTIONS = buildQuestions()

function buildState(req: ChatRequest) {
  return {
    visitor_message: req.message,
    recent_conversation: req.history ?? [],
    services: services.map(({ id, title, examples }) => ({ id, title, examples })),
    projects: projects.map(({ id, title, category, stack }) => ({ id, title, category, stack })),
    skills: stack.map((g) => ({ area: g.title, tools: g.skills })),
  }
}

/* --------------------------------- Replies --------------------------------- */

/** The chosen option, or null when it's "none"/"unlisted" or too uncertain to use. */
function picked(answer: ChoiceAnswer): string | null {
  const p = answer.probabilities[answer.choice] ?? 0
  return answer.choice === 'none' || p < MIN_OPTION_PROBABILITY ? null : answer.choice
}

const bullets = (lines: string[]) => lines.map((l) => `• ${l}`).join('\n')

function describeService(s: Service) {
  return `${s.title}: ${s.description}`
}

function describeProject(p: Project) {
  const lines = [`${p.title}`, `Problem: ${p.problem}`, `What Paul built:\n${bullets(p.built.slice(0, 3))}`]
  lines.push(`Stack: ${p.stack.join(', ')}`)
  if (p.demoAnchor) lines.push('There’s a live demo further down this page.')
  return lines.join('\n\n')
}

function describeGroup(g: SkillGroup) {
  return `${g.title}: ${g.skills.join(', ')}`
}

type Judgments = {
  intent: ChatIntent
  service: Service | null
  project: Project | null
  skill: { name: string; group: SkillGroup } | 'unlisted' | null
  hireProbability: number
}

export function composeReply(j: Judgments): Omit<ChatResponse, 'ok'> {
  let reply: string
  let cta: ChatResponse['cta'] = null
  let suggestions = DEFAULT_SUGGESTIONS

  switch (j.intent) {
    case 'greeting':
      reply = `Hi! I’m the assistant on ${profile.shortName}’s site. Ask me what Paul builds, about a past project, his stack, or how to get started.`
      break

    case 'services_overview':
      reply = `Paul is a ${profile.role.toLowerCase()} working remotely with AU, US and global clients. He builds:\n\n${bullets(services.map((s) => s.title))}\n\nAsk about any of these, or describe what you need.`
      suggestions = ['Can you connect my form to a CRM?', 'Do you build AI chat agents?', 'How does a project work?']
      break

    case 'can_you_help':
      if (j.service) {
        reply = `Yes, that falls under ${describeService(j.service)}`
        if (j.project) reply += `\n\nRelated work: ${j.project.title}.`
      } else {
        reply =
          'That isn’t one of Paul’s core services. If it involves a website, an API, automation or AI, it may still be a fit. Send a short brief through the contact form and Paul will tell you honestly.'
      }
      cta = CONTACT_CTA
      suggestions = ['How does a project work?', 'Show me a similar project', 'What does it cost?']
      break

    case 'project_question':
      reply = j.project
        ? describeProject(j.project)
        : `Here are Paul’s case studies:\n\n${bullets(projects.map((p) => p.title))}\n\nAsk about any one for the details.`
      suggestions = ['How does the 360° hero work?', 'Tell me about the Melbourne quote system', 'What’s the AI enquiry classifier?']
      break

    case 'stack_question':
      if (j.skill === 'unlisted') {
        reply = `That isn’t in Paul’s core stack. What he works with day to day:\n\n${bullets(stack.map(describeGroup))}`
      } else if (j.skill) {
        reply = `Yes, ${j.skill.name} is part of Paul’s ${j.skill.group.title} work. ${j.skill.group.summary}`
      } else {
        reply = `Paul’s stack by area:\n\n${bullets(stack.map(describeGroup))}`
      }
      break

    case 'pricing':
      reply =
        'Pricing depends on scope, so Paul quotes each build after a short look at what you need. Ongoing work can run as a monthly retainer. Send a brief through the contact form and you’ll get a quote by email.'
      cta = CONTACT_CTA
      break

    case 'process_availability':
      reply = `Paul is based in the ${profile.location} and works remotely with AU, US and global clients. A project runs in four steps:\n\n${bullets(
        processSteps.map((s) => `${s.title}: ${s.description}`),
      )}`
      cta = CONTACT_CTA
      break

    case 'hire_contact':
      reply = `Great! The contact form at the bottom of this page goes straight to Paul, and he replies by email. You can also email him directly: ${profile.email}`
      cta = CONTACT_CTA
      suggestions = ['What should I include in my brief?', 'How does a project work?']
      break

    case 'off_topic':
      reply = 'I can only help with questions about Paul’s work: what he builds, past projects, his stack, and how to hire him.'
      break

    case 'unclear':
    default:
      reply = 'I didn’t quite catch that. I can tell you what Paul builds, walk through a past project, list his stack, or explain how to start a project.'
  }

  // Hiring signal on an otherwise informational answer: add a gentle nudge.
  if (!cta && j.hireProbability >= HIRE_NUDGE) {
    reply += '\n\nSounds like you have a project in mind. The contact form is the quickest way to get it moving.'
    cta = CONTACT_CTA
  }

  return { reply, intent: j.intent, cta, suggestions }
}

export async function answerChat(apiKey: string, req: ChatRequest): Promise<Omit<ChatResponse, 'ok'>> {
  const a = await systemOne(apiKey, buildState(req), QUESTIONS)

  const intent: ChatIntent = a.intent.confidence < MIN_INTENT_CONFIDENCE ? 'unclear' : a.intent.choice
  const serviceId = picked(a.service)
  const projectId = picked(a.project)
  const skillKey = a.skill.choice === 'unlisted' ? 'unlisted' : picked(a.skill)

  return composeReply({
    intent,
    service: services.find((s) => s.id === serviceId) ?? null,
    project: projects.find((p) => p.id === projectId) ?? null,
    skill: skillKey === 'unlisted' ? 'unlisted' : (skillKey && skillByKey.get(skillKey)) || null,
    hireProbability: a.wants_to_hire.noul,
  })
}
