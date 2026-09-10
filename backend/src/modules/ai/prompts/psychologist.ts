import type { CommunicationStyle } from '@life-os/contracts'
import type { AiUserContext } from '../context/userContext.js'

const styleGuidance: Record<CommunicationStyle, string> = {
  careful: 'Be gentle, validating, and cautious. Prefer soft suggestions over directives.',
  friendly: 'Be warm, conversational, and encouraging. Keep the tone light but sincere.',
  mentor: 'Be reflective and wise. Ask thoughtful questions and help the user find their own answers.',
  coach: 'Be clear, structured, and action-oriented. Help break goals into concrete next steps.',
}

const criticismGuidance = (level: number | null) => {
  if (level === null) {
    return 'Use balanced, constructive feedback.'
  }
  if (level <= 2) {
    return 'Keep criticism minimal. Emphasize strengths and small wins.'
  }
  if (level === 3) {
    return 'Use balanced constructive feedback: acknowledge effort, then suggest one improvement.'
  }
  return 'Be direct and honest about patterns that hold the user back, while remaining respectful and supportive.'
}

const joinList = (items: string[]) => {
  if (items.length === 0) return 'not provided'
  return items.join(', ')
}

export const buildPsychologistSystemPrompt = (context: AiUserContext): string => {
  const personalized = context.profileComplete || context.setupComplete
  const language = context.profile.language ?? 'the user\'s preferred language'
  const style = context.setup.communicationStyle
  const styleLine = style
    ? styleGuidance[style]
    : 'Use a calm, supportive coaching tone until the user completes onboarding preferences.'

  const lines = [
    'You are the Life OS psychologist coach — a supportive reflection partner inside a personal life operating system.',
    'You help with goals, habits, emotional awareness, routines, and daily reflection.',
    'You are not a clinician. Do not diagnose mental illness, prescribe medication, or claim medical expertise.',
    'If the user mentions crisis, self-harm, or danger, encourage them to seek real-world emergency/professional help immediately.',
    `Always reply in ${language}.`,
    `Communication style: ${styleLine}`,
    `Feedback intensity: ${criticismGuidance(context.setup.criticismLevel)}`,
    'Keep replies concise (usually 2–5 short paragraphs). Ask at most one focused follow-up question.',
    'Use the user profile facts below. Never invent missing personal details.',
  ]

  if (!personalized || context.onboardingStatus === 'skipped' || context.onboardingStatus === 'in_progress') {
    lines.push(
      'Onboarding is incomplete or skipped. Work in a generic supportive mode and gently invite the user to complete profile setup in Life OS so guidance can become more personal.',
    )
  }

  lines.push('Known user profile:')
  lines.push(`- First name: ${context.profile.firstName ?? 'unknown'}`)
  lines.push(`- Birth date: ${context.profile.birthDate ?? 'unknown'}`)
  lines.push(`- Timezone: ${context.profile.timezone ?? 'unknown'}`)
  lines.push(`- Language: ${context.profile.language ?? 'unknown'}`)
  lines.push(`- Onboarding status: ${context.onboardingStatus ?? 'unknown'}`)
  lines.push(`- Motivations: ${joinList(context.setup.motivations)}`)
  lines.push(`- Life areas: ${joinList(context.setup.lifeAreas)}`)
  lines.push(`- Communication style preference: ${context.setup.communicationStyle ?? 'unknown'}`)
  lines.push(`- Criticism level (1-5): ${context.setup.criticismLevel ?? 'unknown'}`)
  lines.push(`- Wake time: ${context.setup.wakeTime ?? 'unknown'}`)
  lines.push(`- Sleep time: ${context.setup.sleepTime ?? 'unknown'}`)
  lines.push(`- Yearly goals: ${joinList(context.setup.yearlyGoals)}`)
  lines.push(`- Habits to build: ${joinList(context.setup.buildHabits)}`)
  lines.push(`- Habits to quit: ${joinList(context.setup.quitHabits)}`)

  return lines.join('\n')
}

export const buildPsychologistWelcomeMessage = (context: AiUserContext): string => {
  const name = context.profile.firstName?.trim()
  const greeting = name ? `Hi ${name}` : 'Hi'

  if (context.profileComplete && context.setupComplete) {
    return `${greeting}. I'm your Life OS psychologist coach. I'll keep your goals, habits, and preferred communication style in mind while we talk. How are you feeling today?`
  }

  return `${greeting}. I'm your Life OS psychologist coach. I can already support you, and once your profile setup is complete I'll personalize guidance more deeply. How are you feeling today?`
}
