import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, PlusSquare, CheckCircle, X } from 'lucide-react';
import { detectDeviceType } from '../services/pushNotificationService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  variant?: 'banner' | 'button' | 'compact';
  onInstalled?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ variant = 'banner', onInstalled }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect if already installed / standalone
    const isApp = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    setIsStandalone(isApp);
    setDeviceType(detectDeviceType());

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      if (onInstalled) onInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstalled]);

  // If already running inside installed standalone app, don't show prompt
  if (isStandalone || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deviceType === 'ios') {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      // In Android or desktop without prompt event, show helpful tip
      alert('Para instalar: abra o menu do navegador (três pontinhos ⋮ ou Compartilhar) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".');
    }
  };

  // Compact button variant for header/sidebar
  if (variant === 'button' || variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-bold transition shadow-sm"
          title="Instalar CTVacinas como Aplicativo no Celular / Computador"
        >
          <Smartphone size={14} className="text-teal-600 shrink-0" />
          <span>{deviceType === 'ios' ? 'Instalar no iPhone' : 'Instalar App (PWA)'}</span>
        </button>

        {showIosGuide && (
          <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-xs">
                    CT
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Instalar no iPhone (iOS)</h4>
                    <p className="text-[10px] text-slate-500">Adicione à tela inicial em 2 passos</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIosGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <Share2 size={16} />
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-semibold">1. Toque em Compartilhar</strong>
                    <span className="text-[11px] text-slate-500">Na barra inferior do Safari, clique no ícone de compartilhamento.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                    <PlusSquare size={16} />
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-semibold">2. "Adicionar à Tela de Início"</strong>
                    <span className="text-[11px] text-slate-500">Role para baixo nas opções e toque em <strong>Adicionar à Tela de Início</strong>.</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Banner variant for top of mobile / desktop view
  return (
    <>
      <div className="mx-3 my-2 p-3 bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-xl shadow-md border border-teal-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
            <Smartphone size={20} className="text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-200 uppercase tracking-wider">Aplicativo CTVacinas</span>
              <span className="px-1.5 py-0.5 bg-teal-500/30 text-teal-300 text-[9px] font-bold rounded">PWA</span>
            </div>
            <p className="text-xs text-slate-200 mt-0.5">
              Instale na tela inicial do celular para receber notificações de atividades críticas às 09h00.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow transition"
          >
            <Download size={14} />
            <span>{deviceType === 'ios' ? 'Instalar no iOS' : 'Instalar Agora'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title="Dispensar aviso"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-xs">
                  CT
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Instalar no iPhone (iOS)</h4>
                  <p className="text-[10px] text-slate-500">Adicione à tela inicial em 2 passos</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                  <Share2 size={16} />
                </div>
                <div>
                  <strong className="block text-slate-900 font-semibold">1. Toque em Compartilhar</strong>
                  <span className="text-[11px] text-slate-500">Na barra inferior do Safari, clique no ícone de compartilhamento.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <PlusSquare size={16} />
                </div>
                <div>
                  <strong className="block text-slate-900 font-semibold">2. "Adicionar à Tela de Início"</strong>
                  <span className="text-[11px] text-slate-500">Role para baixo nas opções e toque em <strong>Adicionar à Tela de Início</strong>.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
