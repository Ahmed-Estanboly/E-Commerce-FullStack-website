import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { authService } from '../lib/api/auth.service'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
      setIsLoggedIn(true)
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
    <main className="login-page">
      <section className="login-art" aria-label="Nova store">
        <div className="brand-mark" aria-hidden="true">N</div>
        <div className="art-copy">
          <p className="eyebrow">The considered edit</p>
          <h1>Good things,<br /><em>well chosen.</em></h1>
          <p className="art-description">A calmer way to discover the pieces that make everyday life feel more like yours.</p>
        </div>
        <div className="art-footer">
          <span>01</span>
          <span className="art-line" aria-hidden="true" />
          <span>04</span>
          <span className="art-caption">New season, quietly arrived</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-content">
          <div className="mobile-brand"><span className="brand-mark" aria-hidden="true">N</span> nova</div>
          {isLoggedIn ? (
            <div className="success-state" role="status">
              <span className="success-icon" aria-hidden="true">&#10003;</span>
              <p className="eyebrow">You are signed in</p>
              <h2>Welcome back.</h2>
              <p>Your account is ready. We are preparing your personal edit.</p>
              <button className="submit-button" type="button" onClick={() => setIsLoggedIn(false)}>Return to sign in</button>
            </div>
          ) : (
            <>
              <div className="login-heading">
                <p className="eyebrow">Welcome back</p>
                <h2>Sign in to nova</h2>
                <p>Pick up where you left off.</p>
              </div>

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className="field-group">
                  <label htmlFor="email">Email address</label>
                  <input
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

                <div className="field-group">
                  <div className="field-label-row">
                    <label htmlFor="password">Password</label>
                    <button className="text-button" type="button" onClick={() => setShowPassword((visible) => !visible)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
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

                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                    <span>Remember me</span>
                  </label>
                  <button className="text-button" type="button" onClick={() => setError('Password reset is not available yet. Please contact support.')}>Forgot password?</button>
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}

                <button className="submit-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                  {!isSubmitting && <span aria-hidden="true">&#8594;</span>}
                </button>
              </form>

              <p className="signup-prompt">New to nova? <button className="text-button" type="button" onClick={() => setError('Account creation is not available yet. Please contact support.')}>Create an account</button></p>
            </>
          )}
        </div>
        <p className="legal-copy">By continuing, you agree to our Terms and Privacy Policy.</p>
      </section>
    </main>
  )
}

export default Login
