
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
 * Focada em validar permissões reais de pasta no SharePoint
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
const FOLDER_PATH = "root:/Sistema";
const DB_PATH = `${FOLDER_PATH}/database.json`;
const APP_SCOPES = ["Files.ReadWrite", "Sites.ReadWrite.All", "User.Read"];

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
      const res = await inst.loginPopup({ 
        scopes: APP_SCOPES,
        prompt: "select_account" 
      });
      return { success: true, account: res.account, error: null };
    } catch (e: any) {
      if (e.errorCode === 'user_cancelled') return { success: false, account: null, error: 'cancelled' };
      return { success: false, account: null, error: e.message || "Erro na autenticação Microsoft" };
    }
  },

  async logout() {
    const inst = await this.init();
    const account = await this.getAccount();
    if (account) {
      await inst.logoutPopup({ account, postLogoutRedirectUri: window.location.origin });
      localStorage.clear();
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
    if (!account) throw new Error("Sessão expirada");
    try {
      const res = await inst.acquireTokenSilent({ scopes: APP_SCOPES, account });
      return res.accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        const res = await inst.acquireTokenPopup({ scopes: APP_SCOPES });
        return res.accessToken;
      }
      throw e;
    }
  },

  async getSiteId() {
    const token = await this.getToken();
    const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${SITE_PATH}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
  },

  /**
   * VERIFICAÇÃO CRÍTICA: Tenta acessar a pasta do sistema.
   * Se der 403, o usuário NÃO tem permissão na pasta, mesmo logado.
   */
  async checkAccess() {
    try {
      const token = await this.getToken();
      const siteId = await this.getSiteId();
      if (!siteId) return false;

      // Tenta listar a pasta /Sistema
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/${FOLDER_PATH}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return res.ok; // Retorna true apenas se conseguir ler as propriedades da pasta
    } catch {
      return false;
    }
  },

  async load() {
    try {
      const token = await this.getToken();
      const siteId = await this.getSiteId();
      if (!siteId) return null;

      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/${DB_PATH}:/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 404) {
        // Arquivo não existe na pasta (Pasta vazia como na foto). 
        // Retornamos null para o App saber que deve criar o banco inicial.
        return null;
      }

      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async save(data: any) {
    try {
      const token = await this.getToken();
      const siteId = await this.getSiteId();
      if (!siteId) return false;

      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/${DB_PATH}:/content`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lastSync: new Date().toISOString() })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
