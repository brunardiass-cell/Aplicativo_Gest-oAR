
import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';
import { Task, AppConfig } from '../types';

/**
 * CONFIGURAÇÃO CORPORATIVA - GESTÃO DE ATIVIDADES PAR
 */
const msalConfig: Configuration = {
  auth: {
    clientId: "609422c2-d648-4b50-b1fe-ca614b77ffb5",
    // Authority usando o Directory (Tenant) ID fornecido
    authority: "https://login.microsoftonline.com/f51c2ea8-6e50-4e8f-a3e3-30c69e99d323",
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  }
};

const SHAREPOINT_SITE_PATH = "ctvacinas974.sharepoint.com:/sites/regulatorios";
const DATABASE_FOLDER = "Sistema";
const DATABASE_FILENAME = "database.json";
const GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";
const SCOPES = ["User.Read", "Mail.Send", "Files.ReadWrite", "Sites.ReadWrite.All"];

let msalInstance: PublicClientApplication | null = null;

export const MicrosoftGraphService = {
  async getInstance() {
    if (!msalInstance) {
      msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();
    }
    return msalInstance;
  },

  async initialize() {
    await this.getInstance();
  },

  async login() {
    const inst = await this.getInstance();
    try {
      const response = await inst.loginPopup({ 
        scopes: SCOPES,
        prompt: "select_account" 
      });
      localStorage.setItem('ms_user_name', response.account.name || response.account.username);
      return response.account;
    } catch (error: any) {
      console.error("Falha no login Microsoft:", error);
      return null;
    }
  },

  async logout() {
    const inst = await this.getInstance();
    const accounts = inst.getAllAccounts();
    if (accounts.length > 0) {
      await inst.logoutPopup({ account: accounts[0] });
    }
    localStorage.removeItem('ms_user_name');
  },

  async getAccessToken() {
    const inst = await this.getInstance();
    const accounts = inst.getAllAccounts();
    if (accounts.length === 0) return null;

    try {
      const response = await inst.acquireTokenSilent({
        scopes: SCOPES,
        account: accounts[0]
      });
      return response.accessToken;
    } catch (error) {
      try {
        const response = await inst.acquireTokenPopup({ scopes: SCOPES });
        return response.accessToken;
      } catch (err) {
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
      if (data.error) return null;
      return data.id;
    } catch (error) {
      return null;
    }
  },

  async saveDatabase(tasks: Task[], config: AppConfig) {
    const token = await this.getAccessToken();
    const siteId = await this.getSiteId();
    
    // Se não tiver SharePoint, tenta OneDrive como fallback ou retorna erro
    const endpoint = siteId 
      ? `${GRAPH_ENDPOINT}/sites/${siteId}/drive/root:/${DATABASE_FOLDER}/${DATABASE_FILENAME}:/content`
      : `${GRAPH_ENDPOINT}/me/drive/root:/${DATABASE_FOLDER}/${DATABASE_FILENAME}:/content`;

    if (!token) return false;

    const data = JSON.stringify({ 
      tasks, 
      config, 
      lastSync: new Date().toISOString(),
      syncedBy: localStorage.getItem('ms_user_name') || 'Desconhecido'
    });

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async loadDatabase() {
    const token = await this.getAccessToken();
    const siteId = await this.getSiteId();

    const endpoint = siteId 
      ? `${GRAPH_ENDPOINT}/sites/${siteId}/drive/root:/${DATABASE_FOLDER}/${DATABASE_FILENAME}:/content`
      : `${GRAPH_ENDPOINT}/me/drive/root:/${DATABASE_FOLDER}/${DATABASE_FILENAME}:/content`;

    if (!token) return null;

    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 404) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
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
