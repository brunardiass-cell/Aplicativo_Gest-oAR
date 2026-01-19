
import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';
import { Task, AppConfig } from '../types';

/**
 * CREDENCIAIS CTVACINAS - GESTÃO PAR
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
    storeAuthStateInCookie: true,
  }
};

const SITE_URL = "ctvacinas974.sharepoint.com:/sites/regulatorios";
const FOLDER_PATH = "Sistema";
const FILE_NAME = "database.json";
const GRAPH_URL = "https://graph.microsoft.com/v1.0";
const SCOPES = ["User.Read", "Files.ReadWrite", "Sites.ReadWrite.All"];

let msalInstance: PublicClientApplication | null = null;

export const MicrosoftGraphService = {
  async initialize() {
    await this.getInstance();
  },

  async getInstance() {
    if (!msalInstance) {
      msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();
    }
    return msalInstance;
  },

  async getUserInfo() {
    const inst = await this.getInstance();
    const accounts = inst.getAllAccounts();
    if (accounts.length > 0) {
      return accounts[0];
    }
    return null;
  },

  async login() {
    const inst = await this.getInstance();
    try {
      const result = await inst.loginPopup({ scopes: SCOPES });
      return result.account;
    } catch (error) {
      console.error("Erro Login MS:", error);
      return null;
    }
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
    } catch (e) {
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
      const response = await fetch(`${GRAPH_URL}/sites/${SITE_URL}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.id;
    } catch (error) {
      return null;
    }
  },

  async saveDatabase(tasks: Task[], config: AppConfig) {
    const token = await this.getAccessToken();
    const siteId = await this.getSiteId();
    if (!token || !siteId) return false;

    const body = JSON.stringify({ 
      tasks, 
      config, 
      lastSync: new Date().toISOString()
    });

    try {
      const url = `${GRAPH_URL}/sites/${siteId}/drive/root:/${FOLDER_PATH}/${FILE_NAME}:/content`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro SharePoint:", errorData.error?.message);
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  async loadDatabase() {
    const token = await this.getAccessToken();
    const siteId = await this.getSiteId();
    if (!token || !siteId) return null;

    try {
      const url = `${GRAPH_URL}/sites/${siteId}/drive/root:/${FOLDER_PATH}/${FILE_NAME}:/content`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 404) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  async checkAccess() {
    const id = await this.getSiteId();
    return !!id;
  }
};
