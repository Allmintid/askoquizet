import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Button } from '../components/ui'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(async () => window.confirm('Are you sure?'))

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(v: boolean) => void>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function close(result: boolean) {
    setOptions(null)
    resolver.current?.(result)
    resolver.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-card bg-cream border border-stone/30 shadow-lg p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">{options.title}</h2>
              {options.description && (
                <p className="text-ink/70 mt-1 text-sm">{options.description}</p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => close(false)}>
                {options.cancelLabel ?? 'Cancel'}
              </Button>
              <Button variant={options.variant ?? 'primary'} onClick={() => close(true)}>
                {options.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
