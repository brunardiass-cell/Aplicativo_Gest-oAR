
import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';
import { Task, AppConfig } from '../types';

/**
 * CONFIGURAÇÃO AZURE AD / ENTRA ID - CTVACINAS
 * Nome de exibição: Gestão de Atividades PAR
 */
const msalConfig: Configuration = {
  auth: {
    clientId: "609422c2-d648-4b50-b1fe-ca614b77ffb5",
    authority: "https://login.microsoftonline.com/f51c2ea8-6e50-4e8f-a3e3-30c69e99d323",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  }
};

const SITE_PATH = "ctvacinas974.sharepoint.com:/sites/regulatorios";
const DB_PATH = "root:/Sistema/database.json";
const SCOPES = ["User.Read", "Files.ReadWrite", "Sites.ReadWrite.All", "Mail.Send"];

let pca: PublicClientApplication | null = null;

export const MicrosoftGraphService = {
  async init() {
    if (!pca) {
      pca = new PublicClientApplication(msalConfig);
      await pca.initialize();
    }
    return pca;
  },

  async initialize() {
    return this.init();
  },

  async login() {
    const inst = await this.init();
    try {
      const res = await inst.loginPopup({ scopes: SCOPES });
      return res.account;
    } catch (e) {
      console.error("Erro no login:", e);
      return null;
    }
  },

  async logout() {
    const inst = await this.init();
    const account = await this.getAccount();
    if (account) {
      await inst.logoutPopup({ 
        account, 
        postLogoutRedirectUri: window.location.origin 
      });
    }
  },

  async getAccount() {
    const inst = await this.init();
    const accounts = inst.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  },

  async getToken() {
    const inst = await this.init();
    const account = await this.getAccount();
    if (!account) return null;
    try {
      const res = await inst.acquireTokenSilent({ scopes: SCOPES, account });
      return res.accessToken;
    } catch {
      try {
        const res = await inst.acquireTokenPopup({ scopes: SCOPES });
        return res.accessToken;
      } catch (e) {
        return null;
      }
    }
  },

  async getAccessToken() {
    return this.getToken();
  },

  async getSiteId() {
    const token = await this.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${SITE_PATH}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.id || null;
    } catch { return null; }
  },

  async checkAccess() {
    const siteId = await this.getSiteId();
    return !!siteId;
  },

  async getUserInfo() {
    const token = await this.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },

  async load() {
    const token = await this.getToken();
    const siteId = await this.getSiteId();
    if (!token || !siteId) return null;
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/${DB_PATH}:/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },

  async save(data: { tasks: Task[], config: AppConfig }) {
    const token = await this.getToken();
    const siteId = await this.getSiteId();
    if (!token || !siteId) return false;
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/${DB_PATH}:/content`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          lastSync: new Date().toISOString()
        })
      });
      return res.ok;
    } catch { return false; }
  }
};