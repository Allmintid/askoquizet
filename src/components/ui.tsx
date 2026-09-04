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

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream text-ink flex flex-col">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col px-4 py-6 safe-bottom">
        {children}
      </div>
    </div>
  )
}
