import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Clock, 
  ShieldCheck, 
  Trash2, 
  Send, 
  RefreshCw, 
  X, 
  Info,
  Calendar,
  Layers,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  pushNotificationService, 
  PushDevice, 
  PushLog, 
  PushStatus, 
  detectDeviceType 
} from '../services/pushNotificationService';

interface PushNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: string;
  criticalTasksCount?: number;
}

export const PushNotificationSettingsModal: React.FC<PushNotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser = 'Bruna',
  criticalTasksCount = 0
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'devices' | 'logs'>('status');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<PushStatus | null>(null);
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  const refreshData = async () => {
    setLoading(true);
    try {
      setDeviceType(detectDeviceType());
      setPermission(pushNotificationService.getPermissionState());
      
      const existingSub = await pushNotificationService.getExistingSubscription();
      setIsSubscribed(Boolean(existingSub));

      const [status, devList, logList] = await Promise.all([
        pushNotificationService.getStatus(),
        pushNotificationService.getDevices(),
        pushNotificationService.getLogs()
      ]);

      if (status) setStatusData(status);
      setDevices(devList);
      setLogs(logList);
    } catch (err: any) {
      console.warn('Erro ao carregar dados do Web Push:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await pushNotificationService.subscribe(currentUser);
      if (res.success) {
        setIsSubscribed(true);
        setPermission(pushNotificationService.getPermissionState());
        setFeedbackMessage({ text: 'Notificações ativadas com sucesso neste aparelho!' });
        await refreshData();
      } else {
        setFeedbackMessage({ text: res.error || 'Falha ao ativar notificações push.', isError: true });
      }
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Erro inesperado.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await pushNotificationService.unsubscribe();
      if (res.success) {
        setIsSubscribed(false);
        setFeedbackMessage({ text: 'Notificações desativadas para este aparelho.' });
        await refreshData();
      } else {
        setFeedbackMessage({ text: res.error || 'Erro ao desativar.', isError: true });
      }
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Erro inesperado.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPush = async () => {
    setLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await pushNotificationService.testPush();
      if (res.success) {
        setFeedbackMessage({ 
          text: `Notificação de teste enviada com sucesso! (${res.successfulSends || 1} aparelho(s) notificado(s)). Verifique a barra de notificações.` 
        });
        await refreshData();
      } else {
        setFeedbackMessage({ 
          text: res.error || 'Falha ao disparar notificação de teste. Verifique se há aparelhos registrados.', 
          isError: true 
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Erro ao enviar teste.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (endpointPreview: string) => {
    if (!confirm('Deseja remover este dispositivo da lista de notificações push?')) return;
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: endpointPreview })
      });
      await refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Bell size={22} className="text-teal-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Notificações Inteligentes & PWA
                <span className="px-2 py-0.5 bg-teal-500/30 text-teal-200 text-[10px] font-black rounded-full uppercase tracking-wider">
                  09h00 às 17h00
                </span>
              </h3>
              <p className="text-xs text-teal-200/80">
                Alertas de atividades críticas no celular e computador (com teste a qualquer momento)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'status'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Configuração & Status
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'devices'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dispositivos Conectados
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {devices.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Auditoria / Histórico
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {logs.length}
            </span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className={`mx-5 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            feedbackMessage.isError 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-teal-50 border-teal-200 text-teal-800'
          }`}>
            {feedbackMessage.isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: STATUS & CONFIGURATION */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              
              {/* Device Status Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smartphone size={18} className="text-teal-700" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Este Dispositivo Atual</h4>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {deviceType === 'ios' ? 'Apple iPhone / iPad (iOS)' : deviceType === 'android' ? 'Android Mobile' : 'Computador / Navegador Desktop'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSubscribed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {isSubscribed ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                      {isSubscribed ? 'Push Conectado' : 'Não Ativado'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Permissão do Navegador:</span>
                    <strong className="text-slate-800 capitalize">{permission}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Usuário Vinculado:</span>
                    <strong className="text-slate-800">{currentUser}</strong>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="pt-2 flex flex-wrap gap-2">
                  {!isSubscribed ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSubscribe}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      <Bell size={15} />
                      Ativar Notificações no Aparelho
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleUnsubscribe}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                    >
                      Desativar neste Aparelho
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleTestPush}
                    className="flex items-center justify-center gap-1.5 py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                    title="Dispara notificação de teste imediatamente para verificar funcionamento"
                  >
                    <Send size={13} />
                    Testar Notificação Agora
                  </button>
                </div>
              </div>

              {/* STRICT 09:00 BUSINESS RULE CARD */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-teal-600 text-white rounded-lg shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-teal-900">
                      Janela de Notificações: das 09h00 às 17h00 (Horário Comercial)
                    </h4>
                    <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                      Alertas automáticos para atividades críticas durante o expediente de laboratório e gestão regulatória:
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] text-teal-950 bg-white/70 p-3 rounded-xl border border-teal-200/60">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-teal-700 shrink-0">1. Janela Ativa:</span>
                    <span>Disparos automáticos ocorrem no expediente <strong>entre 09h00 e 17h00</strong> (Horário Oficial de Brasília / America/Sao_Paulo).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-teal-700 shrink-0">2. Atividades Críticas:</span>
                    <span>Apenas atividades com a marcação <strong>Crítica (isCritical)</strong> e status pendente/em andamento são alertadas. Atividades concluídas ou canceladas são excluídas.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-teal-700 shrink-0">3. Teste Imediato a Qualquer Hora:</span>
                    <span>Para seus testes, o botão <strong>"Testar Notificação Agora"</strong> funciona a qualquer momento (sem restrição de horário), enviando o alerta diretamente para os aparelhos conectados.</span>
                  </div>
                </div>

                {statusData && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10px] text-teal-800">
                    <div>
                      <span>Horário atual do servidor: </span>
                      <strong>{statusData.currentBrasiliaTime}</strong>
                    </div>
                    <div>
                      <span>Janela: </span>
                      <strong className="text-emerald-700">09:00 às 17:00</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Critical tasks counter summary */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-slate-600" />
                  <span>Atividades críticas pendentes identificadas:</span>
                </div>
                <span className="font-black px-2 py-0.5 bg-slate-200 rounded text-slate-800">
                  {criticalTasksCount}
                </span>
              </div>

            </div>
          )}

          {/* TAB 2: CONNECTED DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  {devices.length} dispositivo(s) cadastrado(s) no Web Push
                </span>
                <button
                  type="button"
                  onClick={refreshData}
                  className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
                >
                  <RefreshCw size={12} />
                  Atualizar
                </button>
              </div>

              {devices.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  <Smartphone size={32} className="mx-auto mb-2 text-slate-400" />
                  Nenhum dispositivo registrado ainda. Clique em "Ativar Notificações no Aparelho" na aba Status.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {devices.map((dev) => (
                    <div key={dev.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                          <Smartphone size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 capitalize">
                              {dev.deviceType === 'ios' ? 'Apple iPhone (iOS)' : dev.deviceType === 'android' ? 'Android' : 'Desktop'}
                            </span>
                            <span className="text-[10px] text-slate-500">({dev.userName})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Ativo em: {dev.lastActiveAt ? new Date(dev.lastActiveAt).toLocaleDateString('pt-BR') : 'Hoje'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevokeDevice(dev.endpointPreview)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Remover este dispositivo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Histórico de Disparos e Notificações ({logs.length})
                </span>
                <button
                  type="button"
                  onClick={refreshData}
                  className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
                >
                  <RefreshCw size={12} />
                  Atualizar
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  <Clock size={32} className="mx-auto mb-2 text-slate-400" />
                  Nenhum registro de disparo armazenado até o momento.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.type === 'daily_0900' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.type === 'daily_0900' ? 'Agendado (09h00)' : 'Teste Manual'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'skipped_no_critical'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {log.status === 'sent' 
                              ? 'Enviado' 
                              : log.status === 'skipped_no_critical' 
                              ? 'Sem atividades críticas' 
                              : log.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : ''}
                        </span>
                      </div>

                      {log.title && (
                        <p className="font-semibold text-slate-800 text-[11px]">{log.title}</p>
                      )}
                      {log.body && (
                        <p className="text-slate-600 text-[10px]">{log.body}</p>
                      )}

                      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500 border-t border-slate-100">
                        <span>Aparelhos: {log.devicesCount}</span>
                        <span>Sucesso: {log.successfulSends}</span>
                        {log.failedSends > 0 && <span className="text-rose-600">Falhas: {log.failedSends}</span>}
                        {log.activitiesCount > 0 && <span>Atividades críticas: {log.activitiesCount}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>PWA & Web Push nativo • Custo R$ 0 / 0 Tokens</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
