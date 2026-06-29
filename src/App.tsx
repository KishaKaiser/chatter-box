import { Card } from "@/components/ui/card"

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="p-12 max-w-2xl w-full text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">
            Nothing
          </h1>
          <p className="text-xl text-muted-foreground">
            A blank canvas awaits
          </p>
        </div>
      </Card>
    </div>
  )
}

export default App
