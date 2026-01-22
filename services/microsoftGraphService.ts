
import * as msal from "@azure/msal-browser";

// Client ID fixo para a aplicação CT-Vacinas SharePoint
const CLIENT_ID = "3c473f32-385a-4648-8a8b-f452097e85c7"; 

let msalInstance: msal.PublicClientApplication | null = null;

const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite", "Sites.Read.All"]
};

export const MicrosoftGraphService = {
  async init() {
    if (!msalInstance) {
      msalInstance = new msal.PublicClientApplication({
        auth: {
          clientId: CLIENT_ID,
          authority: "https://login.microsoftonline.com/common",
          redirectUri: window.location.origin,
        },
        cache: {
          cacheLocation: "localStorage",
          storeAuthStateInCookie: true,
        }
      });
      await msalInstance.initialize();
    }
    return msalInstance;
  },

  async login() {
    const instance = await this.init();
    try {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        const silentRes = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        return { success: true, account: silentRes.account };
      }
      const loginResponse = await instance.loginPopup(loginRequest);
      return { success: true, account: loginResponse.account };
    } catch (error) {
      console.error("Erro no login Microsoft:", error);
      return { success: false, error };
    }
  },

  async getAccount() {
    const instance = await this.init();
    const accounts = instance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  },

  async getToken() {
    const instance = await this.init();
    const account = await this.getAccount();
    if (!account) return null;

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: account
      });
      return response.accessToken;
    } catch (error) {
      return null;
    }
  },

  async getSiteData(token: string) {
    // Caminho fixo do SharePoint conforme permissão dada
    const siteUrl = "ctvacinas974.sharepoint.com:/sites/regulatorios";
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteUrl}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async loadFromCloud() {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const site = await this.getSiteData(token);
      if (!site.id) return null;

      const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root:/Sistema/db.json:/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error("Erro ao carregar do SharePoint:", error);
      return null;
    }
  },

  async saveToCloud(data: any) {
    const token = await this.getToken();
    if (!token) return false;

    try {
      const site = await this.getSiteData(token);
      if (!site.id) return false;

      const body = JSON.stringify(data);
      const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root:/Sistema/db.json:/content`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: body
      });

      return response.ok;
    } catch (error) {
      console.error("Erro ao salvar no SharePoint:", error);
      return false;
    }
  }
};
