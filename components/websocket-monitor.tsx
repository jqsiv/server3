"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export function WebSocketMonitor() {
  const [messages, setMessages] = useState<{ device: string; message: string; timestamp: string }[]>([])
  const [connectedDevices, setConnectedDevices] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [selectedDevice, setSelectedDevice] = useState("all")

  // In a real app, this would connect to your Heroku server
  // For demo purposes, we'll simulate some device connections and messages
  useEffect(() => {
    // Simulate connected devices
    setConnectedDevices(["ESP32-Device1", "ESP32-Device2"])

    // Simulate incoming messages
    const demoMessages = [
      { device: "ESP32-Device1", message: "Connected to server", timestamp: new Date().toLocaleTimeString() },
      { device: "ESP32-Device2", message: "Connected to server", timestamp: new Date().toLocaleTimeString() },
      { device: "ESP32-Device1", message: "Temperature: 24.5°C", timestamp: new Date().toLocaleTimeString() },
      { device: "ESP32-Device2", message: "Humidity: 65%", timestamp: new Date().toLocaleTimeString() },
    ]

    setMessages(demoMessages)

    // Simulate new messages coming in periodically
    const interval = setInterval(() => {
      const device = Math.random() > 0.5 ? "ESP32-Device1" : "ESP32-Device2"
      const value = (Math.random() * 10 + 20).toFixed(1)
      const newMessage = {
        device,
        message: device === "ESP32-Device1" ? `Temperature: ${value}°C` : `Humidity: ${value}%`,
        timestamp: new Date().toLocaleTimeString(),
      }

      setMessages((prev) => [...prev, newMessage])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const sendMessage = () => {
    if (!message.trim()) return

    // In a real app, this would send the message to your Heroku server
    // For demo purposes, we'll just add it to our messages list
    const newMessage = {
      device: "Server",
      message: `To ${selectedDevice}: ${message}`,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>Currently connected ESP32 devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {connectedDevices.map((device) => (
              <Badge key={device} variant="outline" className="py-1">
                {device} <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Communication Monitor</CardTitle>
          <CardDescription>Real-time messages between devices and server</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Messages</TabsTrigger>
              <TabsTrigger value="ESP32-Device1">Device 1</TabsTrigger>
              <TabsTrigger value="ESP32-Device2">Device 2</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {messages.map((msg, i) => (
                  <div key={i} className="mb-2 pb-2 border-b last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium">{msg.device}</span>
                      <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="ESP32-Device1" className="mt-4">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {messages
                  .filter(
                    (msg) =>
                      msg.device === "ESP32-Device1" || (msg.device === "Server" && msg.message.includes("Device1")),
                  )
                  .map((msg, i) => (
                    <div key={i} className="mb-2 pb-2 border-b last:border-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{msg.device}</span>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="ESP32-Device2" className="mt-4">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {messages
                  .filter(
                    (msg) =>
                      msg.device === "ESP32-Device2" || (msg.device === "Server" && msg.message.includes("Device2")),
                  )
                  .map((msg, i) => (
                    <div key={i} className="mb-2 pb-2 border-b last:border-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{msg.device}</span>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center space-x-2">
            <select
              className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <option value="all">All Devices</option>
              {connectedDevices.map((device) => (
                <option key={device} value={device}>
                  {device}
                </option>
              ))}
            </select>
            <Input
              placeholder="Type a message to send..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
