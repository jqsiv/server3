// This file will be deployed to Heroku
const express = require("express")
const http = require("http")
const WebSocket = require("ws")
const path = require("path")

const PORT = process.env.PORT || 3000
const app = express()

// Serve static files if needed
app.use(express.static(path.join(__dirname, "public")))

// Create HTTP server
const server = http.createServer(app)

// Create WebSocket server
const wss = new WebSocket.Server({ server })

// Store connected clients
const clients = new Map()

// Handle WebSocket connections
wss.on("connection", (ws, req) => {
  const ip = req.socket.remoteAddress
  const deviceId = req.url.split("?id=")[1] || `unknown-${ip}`

  console.log(`Device connected: ${deviceId}`)

  // Store client connection with its ID
  clients.set(ws, { id: deviceId })

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "connection",
      message: "Connected to server",
      timestamp: new Date().toISOString(),
    }),
  )

  // Broadcast to all clients that a new device connected
  broadcastDeviceList()

  // Handle messages from clients
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message)
      console.log(`Received from ${deviceId}: ${JSON.stringify(data)}`)

      // Handle different message types
      if (data.type === "data") {
        // Broadcast data to all other clients
        broadcastMessage(ws, {
          type: "data",
          from: deviceId,
          data: data.data,
          timestamp: new Date().toISOString(),
        })
      } else if (data.type === "command" && data.target) {
        // Forward command to specific device
        sendToDevice(data.target, {
          type: "command",
          from: deviceId,
          command: data.command,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.error("Error processing message:", e)
    }
  })

  // Handle client disconnection
  ws.on("close", () => {
    console.log(`Device disconnected: ${deviceId}`)
    clients.delete(ws)
    broadcastDeviceList()
  })
})

// Broadcast list of connected devices to all clients
function broadcastDeviceList() {
  const deviceList = Array.from(clients.values()).map((client) => client.id)
  const message = JSON.stringify({
    type: "deviceList",
    devices: deviceList,
    timestamp: new Date().toISOString(),
  })

  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  })
}

// Broadcast message to all clients except sender
function broadcastMessage(sender, message) {
  const messageStr = JSON.stringify(message)
  clients.forEach((client, ws) => {
    if (ws !== sender && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr)
    }
  })
}

// Send message to specific device
function sendToDevice(targetId, message) {
  const messageStr = JSON.stringify(message)
  clients.forEach((client, ws) => {
    if (client.id === targetId && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr)
    }
  })
}
// Serve a basic HTML page at the root
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ESP32 WebSocket Server</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .status { 
            background: #f0f0f0; 
            padding: 10px; 
            border-radius: 5px; 
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>ESP32 WebSocket Server</h1>
        <p>Server is running. Connect your ESP32 devices via WebSocket.</p>
        <div class="status">
          <h3>Connection Status:</h3>
          <p>Port: ${PORT}</p>
          <p>WebSocket Endpoint: <code>wss://${req.hostname}</code></p>
        </div>
      </body>
    </html>
  `);
});
// Start the server
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})
