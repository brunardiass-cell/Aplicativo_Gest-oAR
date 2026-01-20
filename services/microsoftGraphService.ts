
import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';
import { Task, AppConfig } from '../types';

/**
 * CONFIGURAÇÃO PARA CONTA PESSOAL
 * Note: Se você receber "unauthorized_client", certifique-se de que o App Registration 
 * no Azure esteja configurado para "Personal Microsoft accounts only" ou "Multitenant + Personal".
 */
const msalConfig: Configuration = {
  auth: {
    clientId: "609422c2-d648-4b50-b1fe-ca614b77ffb5",
    authority: "https://login.microsoftonline.com/common", 
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  }
};

const DATABASE_FOLDER = "Sistema";
const DATABASE_FILENAME = "database.json";
const GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";
const SCOPES = ["User.Read", "Files.ReadWrite"];

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
      if (error.message.includes("unauthorized_client")) {
        alert("O ID do Aplicativo (ClientId) atual parece estar restrito à rede da empresa. Para usar sua conta @outlook ou @hotmail pessoal, o administrador precisa liberar 'Personal Accounts' no Azure Portal.");
      }
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

  // Ignorado para priorizar o OneDrive pessoal
  async getSiteId() {
    return null;
  },

  /**
   * Salva os dados estritamente no OneDrive Pessoal.
   * Caminho: Meus Arquivos > Sistema > database.json
   */
  async saveDatabase(tasks: Task[], config: AppConfig) {
    const token = await this.getAccessToken();
    if (!token) return false;

    const data = JSON.stringify({ 
      tasks, 
      config, 
      lastSync: new Date().toISOString(),
      syncedBy: localStorage.getItem('ms_user_name') || 'Desconhecido'
    });

    try {
      // Endpoint fixo para OneDrive Pessoal
      const response = await fetch(`${GRAPH_ENDPOINT}/me/drive/root:/${DATABASE_FOLDER}/${DATABASE_FILENAME}:/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data
      });
      return response.ok;
    } catch (error) {
      console.error("Erro ao salvar no OneDrive:", error);
      return false;
    }
  },

  /**
   * Carrega os dados do OneDrive Pessoal.
   */
  async loadDatabase() {
    const token = await this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${GRAPH_ENDPOINT}/me/drive/root:/${DATABASE_FOLDER}/${DATABASE_FILENAME}:/content`, {
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
