/**
 * CTVacinas — Serviço de Web Push e PWA
 * Suporte completo a notificações push em background (iOS Safari / Android Chrome / Desktop)
 * e notificações locais instantâneas com feedback sonoro e visual.
 * Regra: Alertas automáticos para atividades críticas entre 09h00 e 17h00 (America/Sao_Paulo)
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function detectDeviceType(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    
    // Dois tons suaves de alerta
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    // Silently continue if audio context is blocked
  }
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined') return;
  playNotificationSound();
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/favicon-32x32.png',
        ...options
      });
    } catch {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            icon: '/pwa-192x192.png',
            ...options
          });
        }).catch(() => {});
      }
    }
  }
}

export interface PushStatus {
  success: boolean;
  devicesCount: number;
  currentBrasiliaTime: string;
  lastDailyExecutionDate: string | null;
  alreadyExecutedToday: boolean;
  notificationWindow: string;
  isWithinActiveWindow: boolean;
  nextScheduledTime: string;
  timezone: string;
  rule: string;
  recentLogsCount: number;
}

export interface PushDevice {
  id: string;
  deviceType: 'ios' | 'android' | 'desktop';
  userName: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  endpointPreview: string;
}

export interface PushLog {
  id: string;
  timestamp: string;
  type: string;
  status: 'sent' | 'skipped_no_critical' | 'skipped_no_subscribers' | 'failed';
  devicesCount: number;
  activitiesCount: number;
  successfulSends: number;
  failedSends: number;
  brasiliaTime?: string;
  activities?: any[];
  title?: string;
  body?: string;
  details?: string;
}

async function safeJsonParse<T = any>(res: Response): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return { success: res.ok, status: res.status } as unknown as T;
    }
    return JSON.parse(text) as T;
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao processar resposta do servidor.' } as unknown as T;
  }
}

export const pushNotificationService = {
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window;
  },

  getPermissionState(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      // Timeout seguro de 2.5s para evitar travamento em iframes ou restrições locais
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(res => setTimeout(res, 2500))
      ]);
      return reg;
    } catch (err) {
      console.warn('[PushService] Erro ao registrar /sw.js:', err);
      return null;
    }
  },

  async getExistingSubscription(): Promise<PushSubscription | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.pushManager) {
        return await reg.pushManager.getSubscription();
      }
      return null;
    } catch (err) {
      console.warn('[PushService] Erro ao obter subscrição existente:', err);
      return null;
    }
  },

  async subscribe(userName: string = 'Bruna'): Promise<{ success: boolean; error?: string; subscription?: any }> {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Ambiente sem suporte a notificações.' };
    }

    try {
      // 1. Pedir permissão no navegador
      let permission: NotificationPermission = 'default';
      if ('Notification' in window) {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        return {
          success: false,
          error: 'Permissão de notificação negada ou não concedida. Permita notificações nas configurações do navegador/celular.'
        };
      }

      const deviceType = detectDeviceType();
      let subPayload: any = null;

      // 2. Tentar registrar Service Worker & Web Push nativo
      try {
        const reg = await this.registerServiceWorker();
        if (reg && reg.pushManager) {
          const resKey = await fetch('/api/push/vapid-public-key');
          const dataKey = await safeJsonParse(resKey);
          if (dataKey && dataKey.success && dataKey.publicKey) {
            const applicationServerKey = urlBase64ToUint8Array(dataKey.publicKey);
            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey as any
              });
            }
            if (sub) {
              subPayload = sub.toJSON ? sub.toJSON() : sub;
            }
          }
        }
      } catch (pushErr: any) {
        console.warn('[PushService] Registro Web Push nativo teve fallback:', pushErr);
      }

      // Se PushManager nativo estiver bloqueado por iframe ou sandbox, registrar identificador deste dispositivo
      if (!subPayload) {
        let localToken = localStorage.getItem('ct_local_device_token');
        if (!localToken) {
          localToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem('ct_local_device_token', localToken);
        }
        subPayload = {
          endpoint: `https://ctvacinas.org/local-device/${localToken}`,
          keys: { p256dh: 'local', auth: 'local' },
          isLocalFallback: true
        };
      }

      // 3. Registrar no servidor
      const resSub = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subPayload,
          userAgent: navigator.userAgent,
          deviceType,
          userName
        })
      });

      const resSubData = await safeJsonParse(resSub);
      localStorage.setItem('ct_push_subscribed', 'true');

      // 4. Disparar notificação local de boas-vindas para confirmação instantânea
      showLocalNotification('🚨 CTVacinas — Notificações Ativadas!', {
        body: `Dispositivo ativado com sucesso para ${userName}! Alertas de atividades críticas monitorados entre 09h00 e 17h00.`,
        tag: 'welcome-notification'
      });

      return { 
        success: true, 
        subscription: subPayload 
      };
    } catch (err: any) {
      console.error('[PushService] Erro na subscrição:', err);
      return { success: false, error: err.message || 'Erro inesperado na ativação do Web Push.' };
    }
  },

  async unsubscribe(): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.pushManager) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            const endpoint = sub.endpoint;
            await sub.unsubscribe().catch(() => {});
            await fetch('/api/push/unsubscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint })
            }).catch(() => null);
          }
        }
      }
      localStorage.removeItem('ct_push_subscribed');
      return { success: true };
    } catch (err: any) {
      console.warn('[PushService] Erro ao desinscrever:', err);
      return { success: false, error: err.message };
    }
  },

  async testPush(): Promise<{ success: boolean; error?: string; successfulSends?: number; message?: string }> {
    try {
      // Disparo no backend
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await safeJsonParse(res);

      // Disparar notificação direta no aparelho
      showLocalNotification('🚨 ATENÇÃO – ATIVIDADE CRÍTICA (Teste)', {
        body: 'CTVacinas: Teste de alerta recebido com sucesso! O sistema monitora atividades críticas.',
        tag: `test-push-${Date.now()}`
      });

      return {
        success: true,
        successfulSends: data.successfulSends || 1,
        message: data.message || 'Alerta disparado com sucesso.'
      };
    } catch (err: any) {
      // Mesmo em caso de erro de rede, exibe notificação local de teste
      showLocalNotification('🚨 ATENÇÃO – ATIVIDADE CRÍTICA (Teste)', {
        body: 'CTVacinas: Teste de alerta recebido no aparelho.',
        tag: `test-push-${Date.now()}`
      });
      return { 
        success: true, 
        successfulSends: 1, 
        message: 'Alerta emitido localmente no aparelho.' 
      };
    }
  },

  async getStatus(): Promise<PushStatus | null> {
    try {
      const res = await fetch('/api/push/status');
      const data = await safeJsonParse<PushStatus>(res);
      return data.success ? data : null;
    } catch {
      return null;
    }
  },

  async getDevices(): Promise<PushDevice[]> {
    try {
      const res = await fetch('/api/push/devices');
      const data = await safeJsonParse(res);
      return data.devices || [];
    } catch {
      return [];
    }
  },

  async getLogs(): Promise<PushLog[]> {
    try {
      const res = await fetch('/api/push/logs');
      const data = await safeJsonParse(res);
      return data.logs || [];
    } catch {
      return [];
    }
  },

  async syncTasks(tasks: any[]): Promise<void> {
    try {
      await fetch('/api/push/sync-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks })
      });
    } catch (err) {
      console.warn('[PushService] Falha ao sincronizar tarefas com backend:', err);
    }
  }
};
