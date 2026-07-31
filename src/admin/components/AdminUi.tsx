import type { ReactNode } from 'react'

export const fieldClass =
  'h-11 w-full border border-[#bfaab3] bg-[#fffdfd] px-3 text-sm text-[#1d171a] outline-none focus:border-[#1d171a] focus:ring-2 focus:ring-[#c992aa]/30'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#984667]">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-serif text-5xl font-light uppercase leading-none text-[#1d171a] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5a62]">
          {description}
        </p>
      </div>
      {action}
    </header>
  )
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`border border-[#cdb8c1] bg-[#fffdfd] p-5 shadow-[0_8px_22px_rgba(29,23,26,0.05)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  )
}

export function Notice({
  children,
  error = false,
}: {
  children: ReactNode
  error?: boolean
}) {
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`rounded-xl px-4 py-3 text-sm ${
        error ? 'bg-red-50 text-red-700' : 'bg-[#f3e3ea] text-[#7a4259]'
      }`}
    >
      {children}
    </p>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="border border-dashed border-[#cdb8c1] bg-[#fff9fb] px-5 py-10 text-center">
      <p className="font-serif text-2xl text-[#1d171a]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b5a62]">
        {description}
      </p>
    </div>
  )
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-11 border border-[#1d171a] bg-[#1d171a] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#984667] disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}
