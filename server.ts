
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import fs from "fs";
import path from "path";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws-updates" });

  const PORT = 3000;
  const DB_FILE = path.join(process.cwd(), "db.json");

  // Track connected clients and their user names
  const clients = new Map<WebSocket, string>();

  wss.on("connection", (ws, req) => {
    clients.set(ws, "Anonymous");
    console.log(`New connection from ${req.socket.remoteAddress}. Total clients: ${clients.size}`);

    const broadcastPresence = () => {
      const activeUsers = Array.from(new Set(Array.from(clients.values()).filter(name => name !== "Anonymous")));
      const message = JSON.stringify({ type: "PRESENCE_UPDATE", users: activeUsers });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    };

    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "USER_JOINED") {
          clients.set(ws, data.user);
          broadcastPresence();
        } else if (data.type === "DATA_UPDATED") {
          console.log(`Data updated by user: ${data.user}. Broadcasting to other clients...`);
          wss.clients.forEach((client) => {
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
      broadcastPresence();
      console.log(`Connection closed: ${code} ${reason}. Total clients: ${clients.size}`);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  // Express JSON Body Parser for large payload (e.g. PDF base64)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Local persistence routes to prevent any data loss
  app.get("/api/data", (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const data = JSON.parse(fileContent);
        return res.json({ success: true, data });
      }
      return res.json({ success: false, data: null, message: "No stored data file yet." });
    } catch (err: any) {
      console.error("Error reading local db.json:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/data", (req, res) => {
    try {
      const data = req.body;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ success: false, error: "Invalid data payload." });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      return res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("Error saving local db.json:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API endpoint to process PDF / Bula with Gemini 2.5 Flash Multimodal
  app.post("/api/parse-bula-pdf", async (req, res) => {
    try {
      const { pdfBase64, filename } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: "Nenhum arquivo PDF ou bula enviado." });
      }

      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "").trim();

      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chave da API Gemini não configurada no servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é um perito em Assuntos Regulatórios, Farmacologia e Imunobiológicos do CTVacinas.
Analise com precisão absoluta o documento PDF / Bula fornecido em anexo ("${filename || 'Bula.pdf'}").

DIRETRIZES CRÍTICAS:
1. Extraia APENAS as informações REALMENTE PRESENTES no documento PDF fornecido. NÃO invente dados de outras vacinas e não substitua informações por exemplos genéricos.
2. Identifique e estruture todos os dados relevantes em Português do Brasil:

### 📄 DADOS IDENTIFICADORES DA VACINA / BULA
- **Nome Comercial / Marca**: [Nome constante na bula]
- **Nome Técnico / Composição Qualitativa**: [Denominação técnica]
- **Fabricante / Empresa / Titular**: [Fabricante]
- **Plataforma Tecnológica**: [Ex: RNAm, Proteína Recombinante, Vetor Viral, Vírus Inativado, etc.]
- **Indicação Terapêutica / Alvo**: [Indicação da vacina]

### 🔬 COMPOSIÇÃO QUALITATIVA E QUANTITATIVA POR DOSE
- **1. ANTÍGENOS / INGREDIENTES ATIVOS (IFA)**:
  - Nome do antígeno e concentração/quantidade exata por dose (Ex: 30 µg, 50 mcg, 1x10^10 partículas)
- **2. ADJUVANTES**:
  - Lista de adjuvantes presentes e suas concentrações/dosagens por dose (Ex: Hidróxido de Alumínio 0.5 mg, QS-21 50 µg)
- **3. EXCIPIENTES E INATIVOS**:
  - Lista de sais, açúcares, tampões e conservantes (Ex: Cloreto de Sódio, Polissorbato 80, Histidina, Sacarose, EDTA) e suas concentrações
- **4. IMPUREZAS / RESÍDUOS REGULADOS**:
  - Impurezas do processo/produto ou limites de tolerância descritos (se houver)

### 📋 RECOMENDAÇÕES REGULATÓRIAS E CONSERVAÇÃO
- **Posologia e Via de Administração**:
- **Condições de Armazenamento / Temperatura e Validade**:
- **Resumo Técnico e Observações Gerais**:

Se alguma informação não for encontrada no documento PDF, escreva explicitamente "(Não informado na bula)".`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64
            }
          },
          prompt
        ]
      });

      const text = response.text || "Não foi possível extrair o texto da bula.";
      res.json({ text, success: true });
    } catch (err: any) {
      console.error("Erro ao processar PDF da bula com Gemini:", err);
      res.status(500).json({ error: err.message || "Erro interno ao processar PDF com Gemini." });
    }
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
