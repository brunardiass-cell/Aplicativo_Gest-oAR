
import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';
import { Task, AppConfig } from '../types';

const msalConfig: Configuration = {
  auth: {
    clientId: "609422c2-d648-4b50-b1fe-ca614b77ffb5",
    authority: "https://login.microsoftonline.com/f51c2ea8-6e50-4e8f-a3e3-30c69e99d323",
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: true }
};

const SITE_PATH = "ctvacinas974.sharepoint.com:/sites/regulatorios";
const DB_PATH = "root:/Sistema/database.json";
const SCOPES = ["User.Read", "Files.ReadWrite", "Sites.ReadWrite.All"];

let pca: PublicClientApplication | null = null;

export const MicrosoftGraphService = {
  // Fix: Initialization logic for MSAL
  async init() {
    if (!pca) {
      pca = new PublicClientApplication(msalConfig);
      await pca.initialize();
    }
    return pca;
  },

  // Fix: Added initialize method as used in SelectionView and AccessControl components
  async initialize() {
    return this.init();
  },

  async login() {
    const inst = await this.init();
    try {
      const res = await inst.loginPopup({ scopes: SCOPES });
      return res.account;
    } catch (e) { return null; }
  },

  // Fix: Added logout method used in App, SelectionView, and AccessControl components
  async logout() {
    const inst = await this.init();
    const account = await this.getAccount();
    if (account) {
      await inst.logoutPopup({ account, postLogoutRedirectUri: window.location.origin });
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

  // Fix: Added getAccessToken method as used in SelectionView and AccessControl components
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

  // Fix: Added checkAccess method used to verify site permissions
  async checkAccess() {
    const siteId = await this.getSiteId();
    return !!siteId;
  },

  // Fix: Added getUserInfo method to fetch authenticated user details
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

  async save(data: any) {
    const token = await this.getToken();
    const siteId = await this.getSiteId();
    if (!token || !siteId) return false;
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/${DB_PATH}:/content`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch { return false; }
  }
};
