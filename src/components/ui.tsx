import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-teal text-cream hover:brightness-110 active:brightness-95',
  secondary: 'bg-orange text-cream hover:brightness-110 active:brightness-95',
  ghost: 'bg-cream-dim text-ink hover:brightness-95',
  danger: 'bg-red text-cream hover:brightness-110 active:brightness-95',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <button
      className={`rounded-pill px-6 py-3 font-display font-semibold text-base shadow-sm transition disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`bg-white/70 rounded-card border border-stone/30 shadow-sm p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-pill px-3 py-1 text-sm font-semibold ${className}`}>
      {children}
    </span>
  )
}

export function isImageAvatar(avatar: string) {
  return /^https?:\/\//.test(avatar)
}

export function Avatar({ avatar, className = '' }: { avatar: string; className?: string }) {
  if (isImageAvatar(avatar)) {
    return (
      <img
        src={avatar}
        alt=""
        className={`inline-block rounded-full object-cover align-middle ${className}`}
      />
    )
  }
  return <span className={`inline-block align-middle ${className}`}>{avatar}</span>
}

const FLOAT_MARKS = [
  { left: '4%', size: '2.5rem', duration: '22s', delay: '0s' },
  { left: '18%', size: '1.75rem', duration: '17s', delay: '5s' },
  { left: '38%', size: '3rem', duration: '26s', delay: '2s' },
  { left: '58%', size: '2rem', duration: '19s', delay: '9s' },
  { left: '76%', size: '2.75rem', duration: '24s', delay: '4s' },
  { left: '92%', size: '1.75rem', duration: '20s', delay: '12s' },
]

export function FloatingQuestionMarks({ className = '' }: { className?: string }) {
  return (
    <div className={`floating-marks ${className}`} aria-hidden="true">
      {FLOAT_MARKS.map((m, i) => (
        <span
          key={i}
          style={{ left: m.left, fontSize: m.size, animationDuration: m.duration, animationDelay: m.delay }}
        >
          ?
        </span>
      ))}
    </div>
  )
}

export function Header() {
  return (
    <header
      className="relative z-10 shrink-0 border-b border-black/40 px-4 py-3 flex items-center justify-center text-cream"
      style={{ backgroundColor: '#303030' }}
    >
      <h1 className="font-display font-bold text-lg tracking-wide">Asköquizet 2026</h1>
    </header>
  )
}

export function Footer({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const styles = variant === 'dark' ? 'border-cream/20 text-cream/60' : 'border-stone/30 text-ink/50'
  return (
    <footer className={`relative z-10 shrink-0 border-t px-4 py-3 text-center text-xs ${styles}`}>
      © Sebbelebebbe
    </footer>
  )
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream text-ink texture-light flex flex-col relative overflow-hidden">
      <FloatingQuestionMarks className="text-ink/10" />
      <Header />
      <div className="relative z-10 mx-auto w-full max-w-md flex-1 flex flex-col px-4 py-6 safe-bottom">
        {children}
      </div>
      <Footer />
    </div>
  )
}
