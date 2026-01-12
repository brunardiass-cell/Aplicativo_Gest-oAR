
import { Task, AppConfig } from '../types';

/**
 * CONFIGURAÇÃO ESPECÍFICA SHAREPOINT CTVACINAS
 */
const SHAREPOINT_SITE_PATH = "ctvacinas974.sharepoint.com:/sites/regulatorios";
const DATABASE_FOLDER = "Sistema";
const DATABASE_FILENAME = "database.json";
const GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";

export const MicrosoftGraphService = {
  // O Token deve vir de uma autenticação MSAL (implementação frontend)
  getAccessToken: () => localStorage.getItem('ms_access_token'),

  /**
   * Obtém o ID do Site do SharePoint baseado no caminho fornecido
   */
  async getSiteId() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${GRAPH_ENDPOINT}/sites/${SHAREPOINT_SITE_PATH}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("Erro ao obter ID do Site SharePoint:", error);
      return null;
    }
  },

  /**
   * Envia E-mail Real via Outlook
   */
  async sendEmail(subject: string, content: string, recipient: string) {
    const token = this.getAccessToken();
    if (!token) return false;

    const emailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: content.replace(/\n/g, '<br>')
        },
        toRecipients: [{ emailAddress: { address: recipient } }]
      }
    };

    try {
      const response = await fetch(`${GRAPH_ENDPOINT}/me/sendMail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  /**
   * Salva o Banco de Dados no SharePoint (Pasta Sistema em Documentos)
   */
  async saveDatabase(tasks: Task[], config: AppConfig) {
    const token = this.getAccessToken();
    const siteId = await this.getSiteId();
    if (!token || !siteId) return false;

    const data = JSON.stringify({ 
      tasks, 
      config, 
      lastSync: new Date().toISOString(),
      syncedBy: localStorage.getItem('ms_user_name') || 'Desconhecido'
    });
    
    try {
      // Caminho: Sites/{id}/drive/root:/{folder}/{file}:/content
      const response = await fetch(`${GRAPH_ENDPOINT}/sites/${siteId}/drive/root:/${DATABASE_FOLDER}/${DATABASE_FILENAME}:/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data
      });
      return response.ok;
    } catch (error) {
      console.error("Erro ao salvar no SharePoint:", error);
      return false;
    }
  },

  /**
   * Carrega o Banco de Dados do SharePoint
   */
  async loadDatabase() {
    const token = this.getAccessToken();
    const siteId = await this.getSiteId();
    if (!token || !siteId) return null;

    try {
      const response = await fetch(`${GRAPH_ENDPOINT}/sites/${siteId}/drive/root:/${DATABASE_FOLDER}/${DATABASE_FILENAME}:/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 404) return null;
      return await response.json();
    } catch (error) {
      console.error("Erro ao carregar do SharePoint:", error);
      return null;
    }
  },

  /**
   * Verifica se o usuário tem acesso ao Site do SharePoint
   */
  async checkAccess() {
    const siteId = await this.getSiteId();
    return !!siteId;
  }
};
