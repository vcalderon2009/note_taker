export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Demo Page</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          This is a demo page to test routing.
        </p>
        <div className="bg-muted/50 p-6 rounded-lg">
          <p>If you can see this, the routing is working correctly!</p>
        </div>
      </div>
    </div>
  );
}
