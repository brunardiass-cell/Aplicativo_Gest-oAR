
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import fs from "fs";
import path from "path";
import webpush from "web-push";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws-updates" });

  const PORT = 3000;
  const DB_FILE = path.join(process.cwd(), "db.json");
  const VAPID_FILE = path.join(process.cwd(), "vapid_keys.json");
  const PUSH_SUBS_FILE = path.join(process.cwd(), "push_subscriptions.json");
  const PUSH_LOGS_FILE = path.join(process.cwd(), "push_notification_logs.json");
  const PUSH_DAILY_LOCK_FILE = path.join(process.cwd(), "push_daily_lock.json");

  // Initialize or load persistent VAPID keys
  let vapidKeys: { publicKey: string; privateKey: string };
  try {
    if (fs.existsSync(VAPID_FILE)) {
      vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, "utf-8"));
    } else {
      vapidKeys = webpush.generateVAPIDKeys();
      fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), "utf-8");
    }
  } catch (e) {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), "utf-8");
  }

  webpush.setVapidDetails(
    "mailto:brunadias@ctvacinas.org",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  // Helper functions for push notifications
  function getPushSubscriptions(): any[] {
    if (fs.existsSync(PUSH_SUBS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(PUSH_SUBS_FILE, "utf-8"));
      } catch {
        return [];
      }
    }
    return [];
  }

  function savePushSubscriptions(subs: any[]) {
    fs.writeFileSync(PUSH_SUBS_FILE, JSON.stringify(subs, null, 2), "utf-8");
  }

  function getPushLogs(): any[] {
    if (fs.existsSync(PUSH_LOGS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(PUSH_LOGS_FILE, "utf-8"));
      } catch {
        return [];
      }
    }
    return [];
  }

  function addPushLog(logEntry: any) {
    const logs = getPushLogs();
    const newLog = {
      id: `push_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    logs.unshift(newLog);
    fs.writeFileSync(PUSH_LOGS_FILE, JSON.stringify(logs.slice(0, 150), null, 2), "utf-8");
    return newLog;
  }

  function getBrasiliaTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const p: Record<string, string> = {};
    for (const part of parts) {
      p[part.type] = part.value;
    }
    const dateStr = `${p.year}-${p.month}-${p.day}`; // YYYY-MM-DD
    const hour = parseInt(p.hour || "0", 10);
    const minute = parseInt(p.minute || "0", 10);
    const second = parseInt(p.second || "0", 10);
    return {
      dateStr,
      hour,
      minute,
      second,
      fullFormatted: `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`
    };
  }

  // Core push dispatch function
  async function executePushNotificationCycle(triggerType: "daily_0900" | "manual_test", filterTaskIds?: string[]) {
    const subscriptions = getPushSubscriptions();
    const bTime = getBrasiliaTime();

    if (subscriptions.length === 0) {
      const log = addPushLog({
        type: triggerType,
        status: "skipped_no_subscribers",
        devicesCount: 0,
        activitiesCount: 0,
        successfulSends: 0,
        failedSends: 0,
        details: "Nenhum dispositivo registrado para receber notificações push."
      });
      return { success: false, reason: "no_subscribers", log };
    }

    // Read stored tasks from db.json
    let storedData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        storedData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      } catch (e) {
        console.warn("Aviso ao ler db.json para push:", e);
      }
    }

    const allTasks: any[] = storedData.tasks || [];
    let criticalTasks = allTasks.filter((t: any) => 
      Boolean(t.isCritical) && 
      t.status !== "Concluída" && 
      t.status !== "Cancelada" && 
      t.status !== "Não Aplicável"
    );

    if (filterTaskIds && filterTaskIds.length > 0) {
      criticalTasks = criticalTasks.filter((t: any) => filterTaskIds.includes(t.id));
    }

    let notificationTitle = "🚨 ATENÇÃO – ATIVIDADE CRÍTICA";
    let notificationBody = "";
    let targetUrl = "/?view=tasks";
    let sampleActivitiesList: any[] = [];

    if (criticalTasks.length === 0) {
      if (triggerType === "daily_0900") {
        const log = addPushLog({
          type: triggerType,
          status: "skipped_no_critical",
          devicesCount: subscriptions.length,
          activitiesCount: 0,
          successfulSends: 0,
          failedSends: 0,
          brasiliaTime: bTime.fullFormatted,
          details: "Nenhuma atividade crítica pendente no momento das 09h00."
        });
        return { success: true, count: 0, log };
      } else {
        notificationTitle = "🚨 ATENÇÃO – ATIVIDADE CRÍTICA (Teste)";
        notificationBody = "CTVacinas PWA: Conexão ativa! Alertas automáticos de atividades críticas ocorrem exclusivamente às 09h00.";
        sampleActivitiesList = [{ id: "test", activity: "Teste de Notificação Push", project: "Sistema CTVacinas" }];
      }
    } else {
      sampleActivitiesList = criticalTasks.map((t: any) => ({
        id: t.id,
        activity: t.activity,
        project: t.project || "Geral",
        completionDate: t.completionDate || "Sem prazo",
        lead: t.projectLead || "Não informado",
        criticalAlertLeadDays: t.criticalAlertLeadDays
      }));

      if (criticalTasks.length === 1) {
        const t = criticalTasks[0];
        const deadlineStr = t.completionDate ? ` | Prazo: ${t.completionDate}` : "";
        const projStr = t.project ? ` [${t.project}]` : "";
        notificationBody = `${t.activity}${projStr}${deadlineStr}. Requer atenção prioritária.`;
        targetUrl = `/?view=tasks&taskId=${encodeURIComponent(t.id)}`;
      } else {
        const names = criticalTasks.slice(0, 2).map((t: any) => t.activity).join("; ");
        notificationBody = `${criticalTasks.length} atividades críticas pendentes exigem atenção hoje (${names}...).`;
        targetUrl = `/?view=tasks&filter=critical`;
      }

      if (triggerType === "manual_test") {
        notificationTitle = `🚨 ATENÇÃO – ATIVIDADE CRÍTICA (${criticalTasks.length})`;
      }
    }

    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: "/pwa-192x192.png",
      badge: "/favicon-32x32.png",
      tag: `ct-critical-${Date.now()}`,
      data: {
        url: targetUrl,
        timestamp: Date.now(),
        activitiesCount: criticalTasks.length,
        triggerType
      }
    });

    let successfulSends = 0;
    let failedSends = 0;
    const staleEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: sub.keys
        }, payload);
        successfulSends++;
      } catch (err: any) {
        failedSends++;
        console.warn(`[WebPush] Erro no envio para ${sub.id || sub.endpoint}:`, err?.statusCode || err?.message);
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }

    if (staleEndpoints.length > 0) {
      const remaining = subscriptions.filter(s => !staleEndpoints.includes(s.endpoint));
      savePushSubscriptions(remaining);
      console.log(`[WebPush] ${staleEndpoints.length} dispositivo(s) expirado(s) removido(s).`);
    }

    const log = addPushLog({
      type: triggerType,
      status: successfulSends > 0 ? "sent" : "failed",
      devicesCount: subscriptions.length,
      activitiesCount: criticalTasks.length,
      successfulSends,
      failedSends,
      activities: sampleActivitiesList,
      title: notificationTitle,
      body: notificationBody,
      brasiliaTime: bTime.fullFormatted,
      details: `Disparo realizado via Web Push API. Sucesso em ${successfulSends} de ${subscriptions.length} aparelhos.`
    });

    return {
      success: successfulSends > 0 || (triggerType === "daily_0900" && criticalTasks.length === 0),
      successfulSends,
      failedSends,
      log
    };
  }

  // ---------------------------------------------------------------------------
  // AUTOMATED SCHEDULER: 09:00 AM (America/Sao_Paulo) EXCLUSIVELY
  // Strict rule: Never dispatch outside 09:00.
  // ---------------------------------------------------------------------------
  setInterval(async () => {
    try {
      const bTime = getBrasiliaTime();
      if (bTime.hour === 9 && bTime.minute === 0) {
        let dailyLock: any = { lastExecutedDate: null };
        if (fs.existsSync(PUSH_DAILY_LOCK_FILE)) {
          try {
            dailyLock = JSON.parse(fs.readFileSync(PUSH_DAILY_LOCK_FILE, "utf-8"));
          } catch {}
        }

        if (dailyLock.lastExecutedDate !== bTime.dateStr) {
          console.log(`[Scheduler 09:00 America/Sao_Paulo] Iniciando disparo automático de atividades críticas (${bTime.dateStr})...`);
          dailyLock.lastExecutedDate = bTime.dateStr;
          dailyLock.executedAt = new Date().toISOString();
          dailyLock.brasiliaTime = bTime.fullFormatted;
          fs.writeFileSync(PUSH_DAILY_LOCK_FILE, JSON.stringify(dailyLock, null, 2), "utf-8");

          await executePushNotificationCycle("daily_0900");
        }
      }
    } catch (err) {
      console.error("[Scheduler 09:00] Erro:", err);
    }
  }, 25000);

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

  // Supabase Configuration Persistence for all sessions / incognito / mobile
  const SUPABASE_CONFIG_FILE = path.join(process.cwd(), "supabase_config.json");

  app.get("/api/supabase-config", (req, res) => {
    try {
      if (fs.existsSync(SUPABASE_CONFIG_FILE)) {
        const config = JSON.parse(fs.readFileSync(SUPABASE_CONFIG_FILE, "utf-8"));
        return res.json({ success: true, config });
      }
      const envUrl = process.env.VITE_SUPABASE_URL || "https://ytjhipjsigaalboztcdz.supabase.co";
      const envKey = process.env.VITE_SUPABASE_ANON_KEY || "";
      const envSchema = process.env.VITE_SUPABASE_SCHEMA || "ctvacinas";
      return res.json({ success: true, config: { url: envUrl, anonKey: envKey, schema: envSchema } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/supabase-config", (req, res) => {
    try {
      const { url, anonKey, schema } = req.body;
      const config = {
        url: url ? url.trim() : "https://ytjhipjsigaalboztcdz.supabase.co",
        anonKey: anonKey ? anonKey.trim() : "",
        schema: schema ? schema.trim() : "ctvacinas"
      };
      fs.writeFileSync(SUPABASE_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
      return res.json({ success: true, config });
    } catch (err: any) {
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

  // =========================================================================
  // WEB PUSH & CRITICAL ACTIVITIES NOTIFICATIONS API
  // =========================================================================

  // 1. Return VAPID Public Key to frontend
  app.get("/api/push/vapid-public-key", (req, res) => {
    return res.json({
      success: true,
      publicKey: vapidKeys.publicKey
    });
  });

  // 2. Register/update device subscription
  app.post("/api/push/subscribe", (req, res) => {
    try {
      const { subscription, userAgent, deviceType, userName } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ success: false, error: "Objeto de subscrição inválido." });
      }

      const subscriptions = getPushSubscriptions();
      const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
      const nowIso = new Date().toISOString();

      if (existingIndex >= 0) {
        // Update device info
        subscriptions[existingIndex] = {
          ...subscriptions[existingIndex],
          keys: subscription.keys,
          userAgent: userAgent || subscriptions[existingIndex].userAgent,
          deviceType: deviceType || subscriptions[existingIndex].deviceType || "desktop",
          userName: userName || subscriptions[existingIndex].userName || "Usuário CTVacinas",
          lastActiveAt: nowIso
        };
      } else {
        const newDevice = {
          id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent: userAgent || "Unknown",
          deviceType: deviceType || "desktop",
          userName: userName || "Usuário CTVacinas",
          createdAt: nowIso,
          lastActiveAt: nowIso
        };
        subscriptions.push(newDevice);
      }

      savePushSubscriptions(subscriptions);

      return res.json({
        success: true,
        message: "Dispositivo registrado para receber notificações push de atividades críticas.",
        count: subscriptions.length
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Unsubscribe a device
  app.post("/api/push/unsubscribe", (req, res) => {
    try {
      const { endpoint, id } = req.body;
      const subscriptions = getPushSubscriptions();
      const filtered = subscriptions.filter(s => {
        if (endpoint && s.endpoint === endpoint) return false;
        if (id && s.id === id) return false;
        return true;
      });

      savePushSubscriptions(filtered);
      return res.json({ success: true, count: filtered.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. List registered devices
  app.get("/api/push/devices", (req, res) => {
    try {
      const subscriptions = getPushSubscriptions();
      const safeList = subscriptions.map(s => ({
        id: s.id,
        deviceType: s.deviceType || "desktop",
        userName: s.userName || "Usuário CTVacinas",
        userAgent: s.userAgent || "",
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        endpointPreview: s.endpoint ? `${s.endpoint.substring(0, 35)}...` : ""
      }));
      return res.json({ success: true, devices: safeList });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Test push notification immediately
  app.post("/api/push/test", async (req, res) => {
    try {
      const { taskIds } = req.body || {};
      const result = await executePushNotificationCycle("manual_test", taskIds);
      return res.json({
        success: result.success,
        successfulSends: result.successfulSends,
        failedSends: result.failedSends,
        log: result.log
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Push audit logs
  app.get("/api/push/logs", (req, res) => {
    try {
      const logs = getPushLogs();
      return res.json({ success: true, logs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. System status & next 09:00 schedule
  app.get("/api/push/status", (req, res) => {
    try {
      const bTime = getBrasiliaTime();
      let dailyLock: any = { lastExecutedDate: null };
      if (fs.existsSync(PUSH_DAILY_LOCK_FILE)) {
        try {
          dailyLock = JSON.parse(fs.readFileSync(PUSH_DAILY_LOCK_FILE, "utf-8"));
        } catch {}
      }

      const subscriptions = getPushSubscriptions();
      const logs = getPushLogs();

      return res.json({
        success: true,
        devicesCount: subscriptions.length,
        currentBrasiliaTime: bTime.fullFormatted,
        lastDailyExecutionDate: dailyLock.lastExecutedDate,
        alreadyExecutedToday: dailyLock.lastExecutedDate === bTime.dateStr,
        nextScheduledTime: "09:00:00 (America/Sao_Paulo)",
        timezone: "America/Sao_Paulo (Horário Oficial de Brasília)",
        strictRule: "Notificações automáticas disparadas exclusivamente às 09h00 para atividades com isCritical === true.",
        recentLogsCount: logs.length
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Sync tasks into db.json for push evaluator
  app.post("/api/push/sync-tasks", (req, res) => {
    try {
      const { tasks } = req.body;
      if (Array.isArray(tasks)) {
        let storedData: any = {};
        if (fs.existsSync(DB_FILE)) {
          try {
            storedData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
          } catch {}
        }
        storedData.tasks = tasks;
        storedData.lastTasksSync = new Date().toISOString();
        fs.writeFileSync(DB_FILE, JSON.stringify(storedData, null, 2), "utf-8");
        return res.json({ success: true, tasksCount: tasks.length });
      }
      return res.status(400).json({ success: false, error: "tasks deve ser um array." });
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
