import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">Hello Spark!</h1>
        <p className="text-muted-foreground mb-6">Your app is now running.</p>
        <Button className="bg-primary text-primary-foreground">Get Started</Button>
      </Card>
    </div>
  )
}

export default App
