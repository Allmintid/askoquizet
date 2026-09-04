import { Link } from 'react-router-dom'
import { Button, PageShell } from '../components/ui'

export default function HomePage() {
  return (
    <PageShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
        <div>
          <h1 className="font-display text-5xl font-bold text-teal">Asköquizet 2026</h1>
          <p className="mt-2 text-ink/70">Kul, viktigt och skoj. En lagkapten styr!</p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link to="/join">
            <Button className="w-full" variant="primary">
              Anslut som lag
            </Button>
          </Link>
          <Link to="/admin">
            <Button className="w-full" variant="ghost">
              Sebbes knapp
            </Button>
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
