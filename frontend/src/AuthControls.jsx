import { useEffect, useId, useRef, useState } from 'react'
import { neon } from './lib/neon'

const EMPTY_FORM = { name: '', email: '', password: '' }

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
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const titleId = useId()
  const firstFieldRef = useRef(null)
  const isCreateAccount = mode === 'sign-up'
  const isVerifying = step === 'verify'

  useEffect(() => {
    firstFieldRef.current?.focus()
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, step, submitting])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
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
        setError(authErrorMessage(result.error))
        return
      }

      if (isCreateAccount && result.data?.user && !result.data.user.emailVerified) {
        setStep('verify')
        return
      }

      onClose()
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleVerifyEmail(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await neon.auth.emailOtp.verifyEmail({
        email: form.email.trim(),
        otp: verificationCode.trim(),
      })

      if (result.error) {
        setError(authErrorMessage(result.error))
        return
      }

      onClose()
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  function returnToSignUp() {
    setStep('auth')
    setVerificationCode('')
    setError('')
    setShowPassword(false)
  }

  function switchAuthMode() {
    setError('')
    setShowPassword(false)
    onModeChange(isCreateAccount ? 'sign-in' : 'sign-up')
  }

  return (
    <div className="auth-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !submitting) onClose()
    }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button className="auth-close" type="button" aria-label="Close" onClick={onClose} disabled={submitting}>
          ×
        </button>
        <div className="auth-mark" aria-hidden="true">✦</div>

        <h2 id={titleId}>
          {isVerifying ? 'Verify your email' : isCreateAccount ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="auth-intro">
          {isVerifying
            ? <>We sent a verification code to <strong>{form.email}</strong>. Enter it below to finish creating your account.</>
            : isCreateAccount
            ? 'Create a profile to make this card search your own.'
            : 'Sign in to continue your Yu-Gi-Oh! card search.'}
        </p>

        <form className="auth-form" onSubmit={isVerifying ? handleVerifyEmail : handleSubmit}>
          {isVerifying ? (
            <label>
              Verification code
              <input
                ref={firstFieldRef}
                name="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={event => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                minLength="6"
                maxLength="6"
                pattern="[0-9]{6}"
                placeholder="Enter 6-digit code"
                required
              />
            </label>
          ) : (
            <>
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
                  required
                />
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
            </>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : isVerifying
                ? 'Verify email'
                : isCreateAccount
                  ? 'Create account'
                  : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isVerifying
            ? 'Need to use a different email?'
            : isCreateAccount
              ? 'Already have an account?'
              : 'New to the card search?'}{' '}
          <button
            type="button"
            onClick={() => {
              if (isVerifying) returnToSignUp()
              else switchAuthMode()
            }}
            disabled={submitting}
          >
            {isVerifying ? 'Go back' : isCreateAccount ? 'Sign in' : 'Create one'}
          </button>
        </p>
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

  if (session.isPending) {
    return <div className="auth-controls auth-controls-loading" aria-label="Loading account" />
  }

  if (session.data?.user) {
    const displayName = session.data.user.name || session.data.user.email
    return (
      <div className="auth-controls signed-in-controls">
        <span className="auth-user" title={session.data.user.email}>{displayName}</span>
        <button className="auth-button auth-button-secondary" type="button" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="auth-controls">
        <button className="auth-button auth-button-secondary" type="button" onClick={() => setDialogMode('sign-in')}>
          Sign in
        </button>
        <button className="auth-button auth-button-primary" type="button" onClick={() => setDialogMode('sign-up')}>
          Create account
        </button>
      </div>
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
