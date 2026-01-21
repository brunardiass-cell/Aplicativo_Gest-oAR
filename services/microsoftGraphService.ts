
import { PublicClientApplication, Configuration, InteractionRequiredAuthError } from '@azure/msal-browser';
import { Task, AppConfig, ActivityLog } from '../types';

export class AdminConsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminConsentError';
  }
}

export class ApiPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiPermissionError';
  }
}

/**
 * CONFIGURAÇÃO AZURE AD / ENTRA ID - CTVACINAS
 * Suporte a Convidados Externos e Contas Pessoais
 */
const msalConfig: Configuration = {
  auth: {
    clientId: "609422c2-d648-4b50-b1fe-ca614b77ffb5",
    // Mantemos o Tenant ID específico para garantir que o convidado seja direcionado ao ambiente do CTVacinas
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
const LOGIN_SCOPES = ["User.Read"];
const APP_SCOPES = ["Files.ReadWrite", "Sites.ReadWrite.All"];

let pca: PublicClientApplication | null = null;

export const MicrosoftGraphService = {
  async init() {
    if (!pca) {
      pca = new PublicClientApplication(msalConfig);
      await pca.initialize();
    }
    return pca;
  },

  async login() {
    const inst = await this.init();
    try {
      // Forçamos a seleção de conta para garantir que o usuário escolha o e-mail convidado correto
      const res = await inst.loginPopup({ 
        scopes: LOGIN_SCOPES,
        prompt: "select_account" 
      });
      return { success: true, account: res.account, error: null };
    } catch (e: any) {
      console.error("Erro no login:", e);
      if (e.errorCode === 'user_cancelled' || e.errorCode === 'access_denied') {
        return { success: false, account: null, error: 'cancelled' };
      }
      return { success: false, account: null, error: e.message || e.toString() };
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
      localStorage.clear();
      sessionStorage.clear();
    }
  },

  async getAccount() {
    const inst = await this.init();
    const accounts = inst.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  },

  async getToken(scopes: string[]) {
    const inst = await this.init();
    const account = await this.getAccount();
    if (!account) {
      throw new Error("Sessão expirada. Por favor, faça login novamente.");
    }

    try {
      const res = await inst.acquireTokenSilent({ scopes, account });
      return res.accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        const res = await inst.acquireTokenPopup({ scopes });
        return res.accessToken;
      }
      throw e;
    }
  },

  async getSiteId() {
    try {
      const token = await this.getToken(APP_SCOPES);
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${SITE_PATH}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 403) {
        throw new ApiPermissionError("Acesso Negado (403). Você está logado, mas o SharePoint não reconhece as permissões deste app para sua conta de convidado.");
      }
      
      if (!res.ok) return null;
      const data = await res.json();
      return data.id || null;
    } catch (e) {
      if (e instanceof ApiPermissionError) throw e;
      return null;
    }
  },

  async checkAccess() {
    const siteId = await this.getSiteId();
    return !!siteId;
  },

  async getUserInfo() {
    try {
      const token = await this.getToken(LOGIN_SCOPES);
      const res = await fetch(`https://graph.microsoft.com/v1.0/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },

  async load() {
    const token = await this.getToken(APP_SCOPES);
    const siteId = await this.getSiteId();
    if (!token || !siteId) return null;
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/${DB_PATH}:/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },

  async save(data: any) {
    const token = await this.getToken(APP_SCOPES);
    const siteId = await this.getSiteId();
    if (!token || !siteId) return false;
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/${DB_PATH}:/content`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lastSync: new Date().toISOString() })
      });
      return res.ok;
    } catch { return false; }
  }
};
