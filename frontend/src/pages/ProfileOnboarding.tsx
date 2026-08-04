import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles } from 'lucide-react'
import { Layout } from '../shared/ui/Layout'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shared/ui/select'
import {
  useGetOnboardingState,
  useSaveOnboardingProfile,
} from '../entities/onboarding/model/useOnboarding'

const LANGUAGE_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

const TIMEZONE_OPTIONS = Intl.supportedValuesOf('timeZone')

export default function ProfileOnboarding() {
  const navigate = useNavigate()
  const { data: onboardingState, loading: loadingState, trigger: fetchState } = useGetOnboardingState()
  const { loading: savingProfile, error, trigger: saveProfile } = useSaveOnboardingProfile()
  const [firstName, setFirstName] = useState<string | null>(null)
  const [birthDate, setBirthDate] = useState<string | null>(null)
  const [timezone, setTimezone] = useState<string | null>(null)
  const [language, setLanguage] = useState<string | null>(null)
  const systemTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  useEffect(() => {
    void fetchState()
  }, [fetchState])

  const firstNameValue = firstName ?? onboardingState?.profile?.firstName ?? ''
  const birthDateValue = birthDate ?? onboardingState?.profile?.birthDate ?? ''
  const timezoneValue = timezone ?? onboardingState?.profile?.timezone ?? systemTimezone
  const languageValue = language ?? onboardingState?.profile?.language ?? 'ru'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const result = await saveProfile({
      firstName: firstNameValue.trim(),
      birthDate: birthDateValue || null,
      timezone: timezoneValue,
      language: languageValue,
    })

    if (!result) {
      return
    }

    navigate('/onboarding/setup', { replace: true })
  }

  return (
    <Layout hideNav={true}>
      <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
        <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-4xl bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
          <header className="app-header flex-col items-stretch justify-start gap-0">
            <div className="mb-5 flex w-full items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Sparkles className="size-4 shrink-0 text-[#D7FF35]" />
                <span className="truncate text-sm font-semibold whitespace-nowrap">Life OS setup</span>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D7FF35]">
                First step
              </span>
            </div>
            <h1 className="w-full text-3xl font-black leading-[0.95] tracking-[-0.045em] sm:text-4xl">
              Заполнение профиля
            </h1>
            <p className="mt-3 w-full text-sm leading-6 text-[#92928D]">
              Эти данные нужны, чтобы персонализировать ваш опыт с первого дня.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-1 flex-col gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-[#92928D]">Имя</span>
              <Input
                value={firstNameValue}
                onChange={event => setFirstName(event.target.value)}
                placeholder="Алекс"
                autoComplete="given-name"
                required
                disabled={loadingState || savingProfile}
                className="bg-[#141414] text-[#F4F4F0]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-bold text-[#92928D]">Дата рождения (необязательно)</span>
              <Input
                type="date"
                value={birthDateValue}
                onChange={event => setBirthDate(event.target.value)}
                disabled={loadingState || savingProfile}
                className="bg-[#141414] text-[#F4F4F0]"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#92928D]">Часовой пояс</span>
              <Select
                value={timezoneValue}
                onValueChange={value => setTimezone(value)}
                disabled={loadingState || savingProfile}
              >
                <SelectTrigger className="h-12 w-full rounded-2xl bg-[#141414] px-4 text-left text-[#F4F4F0]">
                  <SelectValue placeholder="Выберите часовой пояс" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#92928D]">Язык</span>
              <Select
                value={languageValue}
                onValueChange={value => setLanguage(value)}
                disabled={loadingState || savingProfile}
              >
                <SelectTrigger className="h-12 w-full rounded-2xl bg-[#141414] px-4 text-left text-[#F4F4F0]">
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={savingProfile || loadingState || !timezoneValue || !languageValue}
              className="mt-auto h-12 rounded-2xl bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90"
            >
              {savingProfile && <Loader2 className="size-4 animate-spin" />}
              Продолжить
            </Button>
          </form>
        </div>
      </main>
    </Layout>
  )
}
