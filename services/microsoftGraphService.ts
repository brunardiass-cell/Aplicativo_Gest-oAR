
import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';
import { Task, AppConfig } from '../types';

/**
 * CONFIGURAÇÃO AZURE AD / ENTRA ID - CTVACINAS
 */
const msalConfig: Configuration = {
  auth: {
    clientId: "609422c2-d648-4b50-b1fe-ca614b77ffb5",
    authority: "https://login.microsoftonline.com/f51c2ea8-6e50-4e8f-a3e3-30c69e99d323",
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error: console.error(message); return;
          case LogLevel.Info: console.info(message); return;
          case LogLevel.Verbose: console.debug(message); return;
          case LogLevel.Warning: console.warn(message); return;
        }
      }
    }
  }
};

const SHAREPOINT_SITE_PATH = "ctvacinas974.sharepoint.com:/sites/regulatorios";
const DATABASE_FOLDER = "Sistema";
const DATABASE_FILENAME = "database.json";
const GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";
const SCOPES = ["User.Read", "Mail.Send", "Files.ReadWrite", "Sites.ReadWrite.All"];

// Instância do MSAL
const msalInstance = new PublicClientApplication(msalConfig);
// Inicialização necessária para a v3
let isInitialized = false;

export const MicrosoftGraphService = {
  async initialize() {
    if (!isInitialized) {
      await msalInstance.initialize();
      isInitialized = true;
    }
  },

  async login() {
    await this.initialize();
    try {
      const response = await msalInstance.loginPopup({ scopes: SCOPES });
      localStorage.setItem('ms_user_name', response.account.name || response.account.username);
      return response.account;
    } catch (error) {
      console.error("Falha no login Microsoft:", error);
      throw error;
    }
  },

  async logout() {
    await this.initialize();
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    await msalInstance.logoutPopup({ account });
    localStorage.removeItem('ms_user_name');
  },

  async getAccessToken() {
    await this.initialize();
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;

    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: SCOPES,
        account: accounts[0]
      });
      return response.accessToken;
    } catch (error) {
      // Se falhar silencioso, tenta via popup
      try {
        const response = await msalInstance.acquireTokenPopup({ scopes: SCOPES });
        return response.accessToken;
      } catch (err) {
        console.error("Erro ao adquirir token:", err);
        return null;
      }
    }
  },

  async getSiteId() {
    const token = await this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${GRAPH_ENDPOINT}/sites/${SHAREPOINT_SITE_PATH}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.id;
    } catch (error) {
      console.error("Erro ao obter ID do Site SharePoint:", error);
      return null;
    }
  },

  async sendEmail(subject: string, content: string, recipient: string) {
    const token = await this.getAccessToken();
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

  async saveDatabase(tasks: Task[], config: AppConfig) {
    const token = await this.getAccessToken();
    const siteId = await this.getSiteId();
    if (!token || !siteId) return false;

    const data = JSON.stringify({ 
      tasks, 
      config, 
      lastSync: new Date().toISOString(),
      syncedBy: localStorage.getItem('ms_user_name') || 'Desconhecido'
    });
    
    try {
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

  async loadDatabase() {
    const token = await this.getAccessToken();
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

  async checkAccess() {
    const siteId = await this.getSiteId();
    return !!siteId;
  },

  async getUserInfo() {
    const token = await this.getAccessToken();
    if (!token) return null;
    const response = await fetch(`${GRAPH_ENDPOINT}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
};
