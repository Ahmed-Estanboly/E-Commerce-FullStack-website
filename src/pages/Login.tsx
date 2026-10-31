import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from '../components/ui/icons'
import { Button } from '../components/ui/button'
import { Logo } from '../components/ui/logo'
import { ThemeToggle } from '../components/layout/theme-toggle'
import { authService } from '../lib/api/auth.service'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.')
      return
    }

    setIsSubmitting(true)

    try {
      const { access_token: accessToken } = await authService.login({
        email: email.trim(),
        password,
      })
      const storage = rememberMe ? localStorage : sessionStorage

      storage.setItem('auth_token', accessToken)
      navigate('/')
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError) && requestError.response?.status === 401
          ? 'Those credentials do not match an account.'
          : 'We could not sign you in. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page relative grid min-h-dvh bg-canvas text-ink lg:grid-cols-[minmax(360px,0.9fr)_minmax(480px,1.1fr)]">
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>
      <section className="auth-art relative flex min-h-[360px] flex-col overflow-hidden bg-inverse px-6 py-7 text-inverse-ink sm:px-10 lg:min-h-dvh lg:px-[9%] lg:py-10" aria-label="NOVA store">
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full border border-accent/30" aria-hidden="true" />
        <div className="absolute right-16 top-20 h-24 w-24 rounded-full border border-accent/20" aria-hidden="true" />
        <Logo className="relative z-10 text-inverse-ink" brandName="NOVA" />
        <div className="auth-art-copy relative z-10 my-auto max-w-lg py-16">
          <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">The considered edit</p>
          <h1 className="max-w-[530px] font-display text-[clamp(3.2rem,6vw,6.6rem)] leading-[0.88] tracking-[-0.05em]">
            Good things,<br /><em className="font-light text-accent">well chosen.</em>
          </h1>
          <p className="mt-8 max-w-xs text-[13px] leading-relaxed text-inverse-ink/70">
            A calmer way to discover the pieces that make everyday life feel more like yours.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-inverse-ink/60">
          <span>01</span>
          <span className="h-px w-12 bg-inverse-ink/50" aria-hidden="true" />
          <span>04</span>
          <span className="ml-auto hidden sm:inline">New season, quietly arrived</span>
        </div>
      </section>

      <section className="auth-panel flex min-h-dvh flex-col justify-center px-6 py-10 sm:px-12 lg:px-[clamp(48px,9vw,130px)]">
        <div className="mx-auto w-full max-w-[390px]">
          <div className="mb-14 lg:hidden"><Logo brandName="NOVA" size="md" /></div>
            <>
              <div className="auth-heading mb-9">
                <p className="eyebrow">Welcome back</p>
                <h2 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] sm:text-[2.8rem]">Sign in to NOVA</h2>
                <p className="mt-4 text-[13px] text-muted">Pick up where you left off.</p>
              </div>

              <form className="auth-form grid gap-6" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft" htmlFor="email">Email address</label>
                  <input
                    className="w-full border-0 border-b border-line-strong bg-transparent px-0 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(error)}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft" htmlFor="password">Password</label>
                    <button className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline" type="button" onClick={() => setShowPassword((visible) => !visible)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    className="w-full border-0 border-b border-line-strong bg-transparent px-0 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(error)}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input className="h-3.5 w-3.5 accent-[var(--accent)]" type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                    <span>Remember me</span>
                  </label>
                  <button className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline" type="button" onClick={() => setError('Password reset is not available yet. Please contact support.')}>Forgot password?</button>
                </div>

                {error && <p className="border border-danger/30 bg-danger-soft px-3 py-2 text-xs leading-relaxed text-danger" role="alert">{error}</p>}

                <Button variant="accent" size="lg" fullWidth type="submit" loading={isSubmitting} rightIcon={!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : undefined}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <p className="mt-8 text-center text-xs text-muted">New to NOVA? <Link className="text-ink underline underline-offset-4 hover:text-ink-soft" to="/register">Create an account</Link></p>
          </>
        </div>
        <p className="mx-auto mt-16 max-w-[390px] text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-muted">By continuing, you agree to our Terms and Privacy Policy.</p>
      </section>
    </main>
  )
}

export default Login
