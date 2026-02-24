
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws-updates" });

  const PORT = 3000;

  // Track connected clients
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws, req) => {
    clients.add(ws);
    console.log(`New connection from ${req.socket.remoteAddress}. Total clients: ${clients.size}`);

    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "DATA_UPDATED") {
          console.log(`Data updated by user: ${data.user}. Broadcasting to ${clients.size - 1} other clients...`);
          clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "RELOAD_REQUIRED", user: data.user }));
            }
          });
        }
      } catch (e) {
        console.error("Error parsing message:", e);
      }
    });

    ws.on("close", (code, reason) => {
      clients.delete(ws);
      console.log(`Connection closed: ${code} ${reason}. Total clients: ${clients.size}`);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
