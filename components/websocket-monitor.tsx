"use client"

import { useState, useEffect, useRef } from "react"
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
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected")
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Connect to your Heroku WebSocket server
    // Adjust the URL to match your Heroku app URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? `${protocol}//${window.location.host}` 
      : 'ws://localhost:3000';
    
    const ws = new WebSocket(`${serverUrl}?id=monitor-client`);
    wsRef.current = ws;
    setConnectionStatus("connecting");

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        
        if (data.type === "deviceList") {
          setConnectedDevices(data.devices);
        } else if (data.type === "data" || data.type === "connection" || data.type === "command") {
          const newMessage = {
            device: data.from || data.type === "connection" ? "Server" : "Unknown",
            message: data.type === "data" ? JSON.stringify(data.data) : 
                    data.type === "command" ? `Command: ${data.command}` : 
                    data.message || JSON.stringify(data),
            timestamp: new Date(data.timestamp).toLocaleTimeString()
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("disconnected");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setConnectionStatus("disconnected");
    };

    // Clean up WebSocket connection when component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const messagePayload = {
      type: "command",
      target: selectedDevice !== "all" ? selectedDevice : undefined,
      command: message
    };

    wsRef.current.send(JSON.stringify(messagePayload));
    
    // Add sent message to the local display
    const newMessage = {
      device: "You",
      message: `To ${selectedDevice}: ${message}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage("");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>Currently connected ESP32 devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className={`h-3 w-3 rounded-full ${
              connectionStatus === "connected" ? "bg-green-500" : 
              connectionStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"
            }`}></div>
            <span className="text-sm">
              {connectionStatus === "connected" ? "Connected to server" : 
               connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {connectedDevices.length > 0 ? (
              connectedDevices.map((device) => (
                <Badge key={device} variant="outline" className="py-1">
                  {device} <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No devices connected</p>
            )}
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
              {connectedDevices.map(device => (
                <TabsTrigger key={device} value={device}>{device}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {messages.length > 0 ? (
                  messages.map((msg, i) => (
                    <div key={i} className="mb-2 pb-2 border-b last:border-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{msg.device}</span>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                )}
              </ScrollArea>
            </TabsContent>
            {connectedDevices.map(device => (
              <TabsContent key={device} value={device} className="mt-4">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  {messages.filter(msg => 
                    msg.device === device || 
                    (msg.device === "Server" && msg.message.includes(device)) ||
                    (msg.device === "You" && msg.message.includes(device))
                  ).length > 0 ? (
                    messages.filter(msg => 
                      msg.device === device || 
                      (msg.device === "Server" && msg.message.includes(device)) ||
                      (msg.device === "You" && msg.message.includes(device))
                    ).map((msg, i) => (
                      <div key={i} className="mb-2 pb-2 border-b last:border-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{msg.device}</span>
                          <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No messages for this device</p>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center space-x-2">
            <select
              className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={connectionStatus !== "connected"}
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
              disabled={connectionStatus !== "connected"}
            />
            <Button 
              onClick={sendMessage} 
              disabled={connectionStatus !== "connected" || !message.trim()}
            >
              Send
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
