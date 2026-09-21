import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

/**
 * A page that throws should say so, not go blank.
 *
 * React unmounts the whole tree on an uncaught render error, which leaves the paper
 * background and nothing else — indistinguishable from a page that simply never loaded. This
 * catches it and states what failed, so a stale module or a bad record is legible rather than
 * a mystery. The message is shown in full: this is an internal tool, and hiding the reason
 * helps nobody.
 */
interface Props {
  children: ReactNode
  /** Where the failure happened, as the reader would name it. */
  where?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ThermalEye render error', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const stale = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
      error.message,
    )

    return (
      <div className="grid min-h-[320px] place-items-center px-6 py-10">
        <div className="border-line bg-card max-w-[62ch] rounded-[14px] border px-5 py-5">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: 'var(--role-accent)' }}>
            {this.props.where ?? 'This view'} failed to render
          </p>
          <p className="mt-2 text-[13.5px]">
            {stale
              ? 'A page file could not be loaded. This usually means the build changed underneath an open tab — reloading picks up the current one.'
              : 'Something in this view threw while rendering. The rest of the app is still usable; the message below is the exact failure.'}
          </p>
          <pre className="border-line bg-paper-deep/50 text-ink-soft panel-scroll mt-3 max-h-[180px] overflow-auto rounded-[8px] border px-3 py-2 font-mono text-[11.5px] whitespace-pre-wrap">
            {error.message}
          </pre>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-ink text-paper inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px]"
            >
              <RotateCcw size={13} strokeWidth={1.9} />
              Reload the page
            </button>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="border-line hover:border-ink-faint text-ink-soft hover:text-ink inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }
}
