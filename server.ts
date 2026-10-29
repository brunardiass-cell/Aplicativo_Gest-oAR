
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

  // EMAIL LOG FILE & STATE
  const EMAIL_LOG_FILE = path.join(process.cwd(), "email_audit_log.json");
  const BACKUP_LOCK_FILE = path.join(process.cwd(), "daily_backup_lock.json");

  // Endpoint to send real or audited emails (default sender: brunadias@ctvacinas.org)
  app.post("/api/send-email", (req, res) => {
    try {
      const { to, subject, body, sender, type, refId, refType, recipientName } = req.body;

      if (!to || typeof to !== "string" || !to.trim()) {
        return res.status(400).json({ success: false, error: "Endereço de e-mail de destino não fornecido ou vazio." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to.trim())) {
        return res.status(400).json({ success: false, error: `Formato de e-mail inválido: "${to}".` });
      }

      if (!subject || !body) {
        return res.status(400).json({ success: false, error: "Assunto e conteúdo do e-mail são obrigatórios." });
      }

      const effectiveSender = sender && sender.trim() ? sender.trim() : "brunadias@ctvacinas.org";
      const nowIso = new Date().toISOString();
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const auditEntry = {
        id: messageId,
        type: type || 'GERAL',
        sender: effectiveSender,
        recipientEmail: to.trim(),
        recipientName: recipientName || '',
        subject: subject.trim(),
        content: body,
        timestamp: nowIso,
        status: 'enviado',
        refId: refId || '',
        refType: refType || ''
      };

      // Persist to email audit log
      let currentLogs: any[] = [];
      if (fs.existsSync(EMAIL_LOG_FILE)) {
        try {
          currentLogs = JSON.parse(fs.readFileSync(EMAIL_LOG_FILE, "utf-8"));
        } catch (e) {
          currentLogs = [];
        }
      }
      currentLogs.unshift(auditEntry);
      fs.writeFileSync(EMAIL_LOG_FILE, JSON.stringify(currentLogs.slice(0, 500), null, 2), "utf-8");

      console.log(`[E-mail Enviado] De: ${effectiveSender} -> Para: ${to} | Assunto: ${subject}`);

      return res.json({
        success: true,
        messageId,
        sender: effectiveSender,
        recipient: to.trim(),
        timestamp: nowIso
      });
    } catch (err: any) {
      console.error("Erro no envio de e-mail:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint to retrieve email audit logs
  app.get("/api/email-audit-log", (req, res) => {
    try {
      if (fs.existsSync(EMAIL_LOG_FILE)) {
        const logs = JSON.parse(fs.readFileSync(EMAIL_LOG_FILE, "utf-8"));
        return res.json({ success: true, logs });
      }
      return res.json({ success: true, logs: [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // DAILY BACKUP LOCK API (Item 5: Trava de execução centralizada)
  app.get("/api/backup-daily-status", (req, res) => {
    try {
      if (fs.existsSync(BACKUP_LOCK_FILE)) {
        const lockData = JSON.parse(fs.readFileSync(BACKUP_LOCK_FILE, "utf-8"));
        return res.json({ success: true, status: lockData });
      }
      return res.json({ success: true, status: { lastBackupDate: null, isRunning: false, history: [] } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/backup-daily-lock", (req, res) => {
    try {
      const { dateStr, user } = req.body;
      const todayStr = dateStr || new Date().toISOString().split('T')[0];

      let lockData: any = { lastBackupDate: null, isRunning: false, lockedAt: null, lockedBy: null, history: [] };
      if (fs.existsSync(BACKUP_LOCK_FILE)) {
        try {
          lockData = JSON.parse(fs.readFileSync(BACKUP_LOCK_FILE, "utf-8"));
        } catch (e) {
          // fallback
        }
      }

      // Check if already completed today
      if (lockData.lastBackupDate === todayStr) {
        return res.json({
          acquired: false,
          alreadyCompleted: true,
          message: `O backup diário de hoje (${todayStr}) já foi realizado com sucesso.`
        });
      }

      // Check if locked and not expired (stale timeout: 5 minutes)
      const now = Date.now();
      const lockTime = lockData.lockedAt ? new Date(lockData.lockedAt).getTime() : 0;
      if (lockData.isRunning && (now - lockTime < 5 * 60 * 1000)) {
        return res.json({
          acquired: false,
          isRunning: true,
          message: `Backup diário em execução por ${lockData.lockedBy || 'outro usuário'}. Aguarde a finalização.`
        });
      }

      // Acquire lock
      lockData.isRunning = true;
      lockData.lockedAt = new Date().toISOString();
      lockData.lockedBy = user || 'Sistema';
      fs.writeFileSync(BACKUP_LOCK_FILE, JSON.stringify(lockData, null, 2), "utf-8");

      return res.json({ acquired: true, dateStr: todayStr });
    } catch (err: any) {
      return res.status(500).json({ acquired: false, error: err.message });
    }
  });

  app.post("/api/backup-daily-complete", (req, res) => {
    try {
      const { dateStr, success, error, user } = req.body;
      const todayStr = dateStr || new Date().toISOString().split('T')[0];

      let lockData: any = { lastBackupDate: null, isRunning: false, lockedAt: null, lockedBy: null, history: [] };
      if (fs.existsSync(BACKUP_LOCK_FILE)) {
        try {
          lockData = JSON.parse(fs.readFileSync(BACKUP_LOCK_FILE, "utf-8"));
        } catch (e) {
          // fallback
        }
      }

      lockData.isRunning = false;
      lockData.lockedAt = null;

      if (success) {
        lockData.lastBackupDate = todayStr;
      }

      const logItem = {
        date: todayStr,
        timestamp: new Date().toISOString(),
        success: Boolean(success),
        error: error || null,
        user: user || lockData.lockedBy || 'Sistema'
      };

      lockData.history = [logItem, ...(lockData.history || [])].slice(0, 100);
      fs.writeFileSync(BACKUP_LOCK_FILE, JSON.stringify(lockData, null, 2), "utf-8");

      return res.json({ success: true, status: lockData });
    } catch (err: any) {
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
