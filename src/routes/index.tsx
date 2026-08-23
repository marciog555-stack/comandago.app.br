import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">ComandaGO</h1>
      <p className="mt-4 text-lg">Fundação em construção — sem UI ainda.</p>
    </div>
  )
}
