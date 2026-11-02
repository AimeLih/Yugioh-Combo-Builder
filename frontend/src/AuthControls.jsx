import { useEffect, useId, useRef, useState } from 'react'
import { neon } from './lib/neon'

const EMPTY_FORM = { name: '', email: '', password: '' }

function authErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'
  return error.message || error.body?.message || 'Something went wrong. Please try again.'
}

function AuthDialog({ mode, onClose, onModeChange }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const titleId = useId()
  const firstFieldRef = useRef(null)
  const isCreateAccount = mode === 'sign-up'

  useEffect(() => {
    firstFieldRef.current?.focus()
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, submitting])

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

  return (
    <div className="auth-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !submitting) onClose()
    }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button className="auth-close" type="button" aria-label="Close" onClick={onClose} disabled={submitting}>
          ×
        </button>
        <div className="auth-mark" aria-hidden="true">✦</div>

        <h2 id={titleId}>{isCreateAccount ? 'Create your account' : 'Welcome back'}</h2>
        <p className="auth-intro">
          {isCreateAccount
            ? 'Create a profile to make this card search your own.'
            : 'Sign in to continue your Yu-Gi-Oh! card search.'}
        </p>

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
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={isCreateAccount ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={updateField}
              minLength="8"
              required
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isCreateAccount ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isCreateAccount ? 'Already have an account?' : 'New to the card search?'}{' '}
          <button
            type="button"
            onClick={() => onModeChange(isCreateAccount ? 'sign-in' : 'sign-up')}
            disabled={submitting}
          >
            {isCreateAccount ? 'Sign in' : 'Create one'}
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
