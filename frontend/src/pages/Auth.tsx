import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../entities/auth/model/useSession'
import { Layout } from '../shared/ui/Layout'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectPath = searchParams.get('redirect') ?? '/dashboard'

  const { login, register } = useSession()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        await login({ email, password })
        navigate(redirectPath, { replace: true })
      } else {
        if (!firstName.trim()) {
          throw new Error('First name is required')
        }
        await register({ email, password, firstName, lastName })
        navigate('/onboarding/profile', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout hideNav={true}>
      <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
        <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-[32px] bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
          <header className="app-header flex items-center justify-between">
            <button
              type="button"
              aria-label="Back to welcome"
              onClick={() => navigate('/introduction')}
              className="icon-button pressable flex size-11 items-center justify-center rounded-[16px] border border-white/10 text-[#F4F4F0] transition hover:bg-white/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#D7FF35]" />
              <span className="text-sm font-semibold">Life OS</span>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7FF35]">
                {isLogin ? 'Welcome back' : 'Build your system'}
              </p>
              <h1 className="text-balance text-5xl font-black leading-[0.95] tracking-[-0.055em]">
                {isLogin ? 'Pick up where you left off.' : 'Start with one intentional day.'}
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#92928D]">
                {isLogin
                  ? 'Your goals, habits, and daily focus are waiting.'
                  : 'Create an account to keep your progress in one calm place.'}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#292929] p-4 text-[#F4F4F0] sm:p-5">
              <div className="mb-5 grid grid-cols-2 rounded-[16px] bg-white/6 p-1" role="tablist" aria-label="Authentication mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  className={`pressable rounded-[13px] py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35] ${
                    isLogin ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'text-[#92928D] hover:text-[#F4F4F0]'
                  }`}
                  onClick={() => {
                    setIsLogin(true)
                    setError(null)
                  }}
                >
                  Log in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isLogin}
                  className={`pressable rounded-[13px] py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35] ${
                    !isLogin ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'text-[#92928D] hover:text-[#F4F4F0]'
                  }`}
                  onClick={() => {
                    setIsLogin(false)
                    setError(null)
                  }}
                >
                  Sign up
                </button>
              </div>

              {error && (
                <div role="alert" className="mb-4 rounded-[14px] border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#92928D]" htmlFor="firstName">
                        First name
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Alex"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        disabled={loading}
                        className="h-12 rounded-[16px]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#92928D]" htmlFor="lastName">
                        Last name
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Morgan"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        disabled={loading}
                        className="h-12 rounded-[16px]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#92928D]" htmlFor="email">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-12 rounded-[16px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#92928D]" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-12 rounded-[16px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="pressable mt-2 h-14 w-full rounded-[18px] bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Please wait
                    </>
                  ) : isLogin ? (
                    'Log in'
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
