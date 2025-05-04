import { WebSocketMonitor } from "@/components/websocket-monitor"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">ESP32 WebSocket Communication</h1>
      <WebSocketMonitor />
    </main>
  )
}
