// Notification Service: Native Web Notifications API for mobile/desktop browsers
// Zero token consumption, no external API cost, 100% native standard

export const NotificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[NotificationService] Notificações não são suportadas neste navegador.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('ct_notifications_enabled', 'true');
        this.notify('Notificações Ativadas!', {
          body: 'Você receberá alertas importantes de prazos, reuniões e atividades no seu celular/dispositivo.',
          icon: '/favicon.ico'
        });
        return true;
      } else {
        localStorage.setItem('ct_notifications_enabled', 'false');
        return false;
      }
    } catch (err) {
      console.error('[NotificationService] Erro ao solicitar permissão:', err);
      return false;
    }
  },

  notify(title: string, options: { body?: string; tag?: string; icon?: string; data?: any } = {}) {
    if (!this.isSupported()) return;

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: options.body || '',
          icon: options.icon || '/favicon.ico',
          tag: options.tag || `notif_${Date.now()}`,
          badge: '/favicon.ico',
          silent: false
        } as any);

        // Som opcional via Web Audio API para feedback sonoro suave
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
          }
        } catch (audioErr) {
          // Áudio não essencial
        }

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('[NotificationService] Falha ao exibir notificação nativa:', err);
      }
    }
  },

  sendNotification(options: { title: string; body?: string; tag?: string; icon?: string }) {
    this.notify(options.title, options);
  }
};

export const notificationService = NotificationService;

