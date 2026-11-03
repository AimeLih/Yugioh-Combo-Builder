import { useEffect, useId, useRef, useState } from 'react'
import { neon } from './lib/neon'

const EMPTY_FORM = { name: '', email: '', password: '' }
const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function isDuplicateEmailError(error) {
  const code = `${error?.code || error?.body?.code || ''}`.toUpperCase()
  const message = authErrorMessage(error)
  return code.includes('USER_ALREADY_EXISTS')
    || /user already exists|email (?:is )?already (?:in use|taken|registered)/i.test(message)
}

function isEmailVerificationRequiredError(error) {
  const code = `${error?.code || error?.body?.code || ''}`.toUpperCase()
  const message = authErrorMessage(error)
  return code.includes('EMAIL_NOT_VERIFIED')
    || /email (?:is )?not verified|verify your email/i.test(message)
}

function authErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'
  return error.message || error.body?.message || 'Something went wrong. Please try again.'
}

function PasswordVisibilityIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5.4 9 5.4a13.7 13.7 0 0 1-2.4 2.9M6.2 6.2C4.2 7.5 3 9.4 3 9.4s3.5 5.4 9 5.4c1 0 2-.2 2.8-.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12s3.5-5.4 9-5.4 9 5.4 9 5.4-3.5 5.4-9 5.4S3 12 3 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function AuthDialog({ mode, onClose, onModeChange }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [step, setStep] = useState('auth')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const titleId = useId()
  const firstFieldRef = useRef(null)
  const isCreateAccount = mode === 'sign-up'
  const isVerifying = step === 'verify'
  const verificationComplete = step === 'complete'
  const busy = submitting || resending

  useEffect(() => {
    firstFieldRef.current?.focus()
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onClose, step])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setEmailError('')
    setSubmitting(true)

    try {
      if (isCreateAccount) {
        const availabilityResponse = await fetch(
          `${API}/yugioh/auth/email-availability?email=${encodeURIComponent(form.email.trim())}`,
        )

        if (!availabilityResponse.ok) {
          throw new Error('We could not check that email address. Please try again.')
        }

        const availability = await availabilityResponse.json()
        if (!availability.available) {
          setEmailError('That email is already taken.')
          return
        }
      }

      const result = isCreateAccount
        ? await neon.auth.signUp.email({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          })
        : await neon.auth.signIn.email({
            email: form.email.trim(),
            password: form.password,
          })

      if (result.error) {
        if (isCreateAccount && isDuplicateEmailError(result.error)) {
          setEmailError('That email is already taken.')
        } else if (!isCreateAccount && isEmailVerificationRequiredError(result.error)) {
          setVerificationEmail(form.email.trim())
          setVerificationCode('')
          setStep('verify')
        } else {
          setError(authErrorMessage(result.error))
        }
        return
      }

      if (isCreateAccount) {
        setVerificationEmail(form.email.trim())
        setVerificationCode('')
        setStep('verify')
        return
      }

      onClose()
    } catch (authError) {
      if (isCreateAccount && isDuplicateEmailError(authError)) {
        setEmailError('That email is already taken.')
      } else {
        setError(authErrorMessage(authError))
      }
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))
    if (event.target.name === 'email') setEmailError('')
  }

  async function handleVerifyEmail(event) {
    event.preventDefault()
    setError('')
    setResendMessage('')
    setSubmitting(true)

    try {
      const result = await neon.auth.emailOtp.verifyEmail({
        email: verificationEmail,
        otp: verificationCode,
      })

      if (result.error) {
        setError(authErrorMessage(result.error))
        return
      }

      setStep('complete')
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendVerification() {
    setError('')
    setResendMessage('')
    setResending(true)

    try {
      const result = await neon.auth.sendVerificationEmail({
        email: verificationEmail,
        callbackURL: `${window.location.origin}/`,
      })

      if (result.error) {
        setError(authErrorMessage(result.error))
        return
      }

      setVerificationCode('')
      setResendMessage('A new verification code was sent.')
      firstFieldRef.current?.focus()
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setResending(false)
    }
  }

  function switchAuthMode() {
    setError('')
    setShowPassword(false)
    onModeChange(isCreateAccount ? 'sign-in' : 'sign-up')
  }

  return (
    <div className="auth-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {isVerifying && (
          <button
            className="auth-resend"
            type="button"
            onClick={handleResendVerification}
            disabled={busy}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
        <button className="auth-close" type="button" aria-label="Close" onClick={onClose} disabled={busy}>
          ×
        </button>
        <div className="auth-mark" aria-hidden="true">✦</div>

        <h2 id={titleId}>
          {verificationComplete
            ? 'Verification complete'
            : isVerifying
              ? 'Verify your email'
              : isCreateAccount
                ? 'Create your account'
                : 'Welcome back'}
        </h2>
        <p className="auth-intro">
          {verificationComplete
            ? 'Your email has been verified. Enjoy the site!'
            : isVerifying
              ? <>Enter the six-digit verification code sent to <strong>{verificationEmail}</strong>.</>
            : isCreateAccount
              ? 'Create a profile to make this card search your own.'
              : 'Sign in to continue your Yu-Gi-Oh! card search.'}
        </p>

        {isVerifying && (
          <form className="auth-form" onSubmit={handleVerifyEmail}>
            <label>
              Verification code
              <input
                ref={firstFieldRef}
                className="auth-code-input"
                name="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={event => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                minLength="6"
                maxLength="6"
                pattern="[0-9]{6}"
                placeholder="000000"
                required
              />
            </label>

            {resendMessage && <p className="auth-resend-status" role="status">{resendMessage}</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-submit" type="submit" disabled={busy}>
              {submitting ? 'Verifying…' : 'Verify email'}
            </button>
          </form>
        )}

        {step === 'auth' && (
          <>
            <form className="auth-form" onSubmit={handleSubmit}>
              {isCreateAccount && (
                <label>
                  Display name
                  <input
                    ref={firstFieldRef}
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={updateField}
                    minLength="2"
                    maxLength="60"
                    required
                  />
                </label>
              )}
              <label>
                Email
                <input
                  ref={isCreateAccount ? null : firstFieldRef}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'auth-email-error' : undefined}
                  required
                />
                {emailError && <span id="auth-email-error" className="auth-field-error" role="alert">{emailError}</span>}
              </label>
              <label>
                Password
                <span className="auth-password-field">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isCreateAccount ? 'new-password' : 'current-password'}
                    value={form.password}
                    onChange={updateField}
                    minLength="8"
                    required
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(visible => !visible)}
                  >
                    <PasswordVisibilityIcon visible={showPassword} />
                  </button>
                </span>
              </label>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button className="auth-submit" type="submit" disabled={submitting}>
                {submitting ? 'Please wait…' : isCreateAccount ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <p className="auth-switch">
              {isCreateAccount ? 'Already have an account?' : 'New to the card search?'}{' '}
              <button type="button" onClick={switchAuthMode} disabled={submitting}>
                {isCreateAccount ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </>
        )}
      </section>
    </div>
  )
}

export default function AuthControls() {
  const session = neon.auth.useSession()
  const [dialogMode, setDialogMode] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await neon.auth.signOut()
    } finally {
      setSigningOut(false)
    }
  }

  let controls

  if (session.isPending) {
    controls = <div className="auth-controls auth-controls-loading" aria-label="Loading account" />
  } else if (session.data?.user) {
    const displayName = session.data.user.name || session.data.user.email
    controls = (
      <div className="auth-controls signed-in-controls">
        <span className="auth-user" title={session.data.user.email}>{displayName}</span>
        <button className="auth-button auth-button-secondary" type="button" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    )
  } else {
    controls = (
      <div className="auth-controls">
        <button className="auth-button auth-button-secondary" type="button" onClick={() => setDialogMode('sign-in')}>
          Sign in
        </button>
        <button className="auth-button auth-button-primary" type="button" onClick={() => setDialogMode('sign-up')}>
          Create account
        </button>
      </div>
    )
  }

  return (
    <>
      {controls}
      {dialogMode && (
        <AuthDialog
          mode={dialogMode}
          onClose={() => setDialogMode(null)}
          onModeChange={setDialogMode}
        />
      )}
    </>
  )
}
