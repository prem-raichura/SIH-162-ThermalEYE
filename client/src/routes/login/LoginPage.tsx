import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Brand } from '@/components/shell/Brand'
import { Button } from '@/components/ui/button'
import { ROLE_LIST, roleEmail } from '@/lib/roles'
import { DEMO_PASSWORD, useRoleStore } from '@/store/useRole'
import { meta, model } from '@/lib/data'
import { nf } from '@/lib/format'

const FIELD =
  'login-field border-line bg-paper flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-[color,background-color,border-color,box-shadow]'
const LABEL = 'text-ink-faint block text-[10px] tracking-[0.1em] uppercase'

/** How long the demo password stays legible before it masks itself again. */
const DEMO_PASSWORD_REVEAL_MS = 60_000
const DEMO_PASSWORD_MASK = '*'.repeat(DEMO_PASSWORD.length)

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useRoleStore((s) => s.signIn)
  const signedInAs = useRoleStore((s) => s.roleId)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The shared demo password starts masked and re-masks itself, so a screen left open on the
  // login page does not sit there showing a working credential.
  const [showDemoPassword, setShowDemoPassword] = useState(false)

  useEffect(() => {
    if (!showDemoPassword) return
    const id = window.setTimeout(() => setShowDemoPassword(false), DEMO_PASSWORD_REVEAL_MS)
    return () => window.clearTimeout(id)
  }, [showDemoPassword])

  if (signedInAs) return <Navigate to={`/${signedInAs}`} replace />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = signIn(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(`/${result.roleId}`)
  }

  const badEmail = error === 'No ThermalEye account for that address.'
  const badPassword = error === 'Incorrect password.'

  const stats: [string, string][] = [
    ['FIRMS detections', nf(meta.realSources.firmsDetections)],
    ['Thermal sites', nf(meta.counts.sites)],
    ['Unmapped candidates', nf(meta.counts.unmapped)],
    ['Macro-F1', model.macroF1.toFixed(3)],
  ]

  return (
    <div className="bg-paper text-ink min-h-dvh">
      <div className="mx-auto grid min-h-dvh max-w-[1240px] grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:py-0">
        <section>
          <Brand size="lg" />

          <h1 className="font-display mt-10 text-[clamp(34px,4.4vw,54px)] leading-[1.05]">
            Something is hot.
            <br />
            The question is what, and whether that is normal.
          </h1>

          <p className="text-ink-soft mt-5 max-w-[58ch] text-[15px]">
            ThermalEye groups six years of NASA FIRMS detections into thermal sites, retrieves source temperature and
            size from the dual-band signal, classifies the likely source, and compares today against each site&rsquo;s
            own history. Facility maps are context, not the answer.
          </p>

          <dl className="border-line divide-line mt-9 flex max-w-[560px] divide-x border-t pt-5">
            {stats.map(([label, value]) => (
              <div key={label} className="flex-1 px-4 first:pl-0">
                <dt className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">{label}</dt>
                <dd className="font-display tnum mt-1 text-[22px]">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="font-hand text-ink-faint mt-8 text-[19px]">From signals to safer tomorrows.</p>
        </section>

        <section className="bg-card border-line rounded-[18px] border p-2">
          <form onSubmit={submit} className="px-4 pt-4 pb-1">
            <h2 className="text-[15px] font-semibold">Log in</h2>
            <p className="text-ink-soft mt-1 text-[13px]">
              Use your ThermalEye organisation account. Your address decides the view you land on.
            </p>

            <label className="mt-6 block">
              <span className={LABEL}>Email address</span>
              <span className={`${FIELD} mt-1.5`}>
                <Mail size={16} strokeWidth={1.8} className="text-ink-faint shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  autoComplete="username"
                  autoFocus
                  spellCheck={false}
                  placeholder="cpcb@thermaleye.in"
                  aria-invalid={badEmail}
                  className="text-ink placeholder:text-ink-faint/70 w-full bg-transparent text-[14px] outline-none"
                />
              </span>
            </label>

            <label className="mt-4 block">
              <span className={LABEL}>Password</span>
              <span className={`${FIELD} mt-1.5`}>
                <Lock size={16} strokeWidth={1.8} className="text-ink-faint shrink-0" />
                <input
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={badPassword}
                  className="text-ink placeholder:text-ink-faint/70 w-full bg-transparent text-[14px] outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? 'Hide password' : 'Show password'}
                  className="text-ink-faint hover:text-ink-soft -mr-1 shrink-0 rounded p-1 transition-colors"
                >
                  {reveal ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="text-terracotta mt-3 text-[12.5px]">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-6 w-full">
              Log in
              <ArrowRight size={16} strokeWidth={1.8} />
            </Button>
          </form>

          <div className="border-line mt-4 border-t px-4 pt-3.5 pb-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">Demo accounts</span>
              <span className="text-ink-soft text-[11.5px]">
                Password for all:{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (showDemoPassword) {
                      setShowDemoPassword(false)
                      return
                    }
                    setShowDemoPassword(true)
                    setPassword(DEMO_PASSWORD)
                    setError(null)
                  }}
                  aria-pressed={showDemoPassword}
                  title={showDemoPassword ? 'Hide the demo password' : 'Show the demo password and fill the form'}
                  className="text-ink hover:bg-paper-deep rounded px-1 py-0.5 font-mono text-[11.5px] transition-colors"
                >
                  {showDemoPassword ? DEMO_PASSWORD : DEMO_PASSWORD_MASK}
                </button>
              </span>
            </div>

            <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2">
              {ROLE_LIST.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(roleEmail(r.id))
                      setPassword(DEMO_PASSWORD)
                      setError(null)
                    }}
                    title={r.org}
                    className="hover:bg-paper-deep flex w-full items-center gap-2 rounded-[6px] px-1.5 py-1 text-left transition-colors"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: r.accent }} />
                    <span className="text-ink-soft truncate font-mono text-[11.5px]">{roleEmail(r.id)}</span>
                    <span className="text-ink-faint ml-auto shrink-0 text-[10.5px]">{r.short}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="text-ink-faint mt-2.5 px-1.5 text-[11px]">
              Demo build. Pick an address to fill the form; every figure is pre-computed from the collected dataset.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
