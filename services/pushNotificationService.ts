/**
 * CTVacinas — Serviço de Web Push e PWA
 * Suporte completo a notificações push em background (iOS Safari / Android Chrome / Desktop)
 * Regra: Alertas automáticos para atividades críticas às 09h00 (America/Sao_Paulo)
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

export interface PushStatus {
  success: boolean;
  devicesCount: number;
  currentBrasiliaTime: string;
  lastDailyExecutionDate: string | null;
  alreadyExecutedToday: boolean;
  nextScheduledTime: string;
  timezone: string;
  strictRule: string;
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
  type: 'daily_0900' | 'manual_test';
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

export const pushNotificationService = {
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  getPermissionState(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.warn('[PushService] Erro ao registrar /sw.js:', err);
      return null;
    }
  },

  async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    } catch (err) {
      console.warn('[PushService] Erro ao obter subscrição existente:', err);
      return null;
    }
  },

  async subscribe(userName: string = 'Bruna'): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Notificações push não são suportadas neste navegador/dispositivo.' };
    }

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          error: 'Permissão de notificação negada. Ative as permissões nas configurações do navegador ou dispositivo.'
        };
      }

      // 2. Ready registration
      const reg = await this.registerServiceWorker();
      if (!reg) {
        return { success: false, error: 'Falha ao registrar o Service Worker.' };
      }

      // 3. Get VAPID public key from backend
      const resKey = await fetch('/api/push/vapid-public-key');
      const dataKey = await resKey.json();
      if (!dataKey.success || !dataKey.publicKey) {
        return { success: false, error: 'Chave pública VAPID não retornada pelo servidor.' };
      }

      const applicationServerKey = urlBase64ToUint8Array(dataKey.publicKey);

      // 4. Check or create subscription
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any
        });
      }

      // 5. Send subscription to server
      const deviceType = detectDeviceType();
      const resSub = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
          deviceType,
          userName
        })
      });

      const resSubData = await resSub.json();
      if (resSubData.success) {
        localStorage.setItem('ct_push_subscribed', 'true');
        return { success: true, subscription: sub };
      } else {
        return { success: false, error: resSubData.error || 'Erro ao sincronizar subscrição no servidor.' };
      }
    } catch (err: any) {
      console.error('[PushService] Erro na subscrição:', err);
      return { success: false, error: err.message || 'Erro inesperado na ativação do Web Push.' };
    }
  },

  async unsubscribe(): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) return { success: true };
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint })
        }).catch(() => null);
      }
      localStorage.removeItem('ct_push_subscribed');
      return { success: true };
    } catch (err: any) {
      console.warn('[PushService] Erro ao desinscrever:', err);
      return { success: false, error: err.message };
    }
  },

  async testPush(): Promise<{ success: boolean; error?: string; successfulSends?: number }> {
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getStatus(): Promise<PushStatus | null> {
    try {
      const res = await fetch('/api/push/status');
      return await res.json();
    } catch {
      return null;
    }
  },

  async getDevices(): Promise<PushDevice[]> {
    try {
      const res = await fetch('/api/push/devices');
      const data = await res.json();
      return data.devices || [];
    } catch {
      return [];
    }
  },

  async getLogs(): Promise<PushLog[]> {
    try {
      const res = await fetch('/api/push/logs');
      const data = await res.json();
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
