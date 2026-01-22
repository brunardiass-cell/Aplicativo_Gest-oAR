
import * as msal from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "00000000-0000-0000-0000-000000000000", // O ambiente deve prover ou o usuário configurar no Azure
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  }
};

const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite", "Sites.Read.All"]
};

let msalInstance: msal.PublicClientApplication | null = null;

export const MicrosoftGraphService = {
  async init() {
    if (!msalInstance) {
      msalInstance = new msal.PublicClientApplication(msalConfig);
      await msalInstance.initialize();
    }
    return msalInstance;
  },

  async login() {
    const instance = await this.init();
    try {
      const loginResponse = await instance.loginPopup(loginRequest);
      return { success: true, account: loginResponse.account };
    } catch (error) {
      console.error("Erro no login Microsoft:", error);
      return { success: false, error };
    }
  },

  async logout() {
    const instance = await this.init();
    await instance.logoutPopup();
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

  async getSiteData() {
    const token = await this.getToken();
    if (!token) return null;

    // Busca o ID do site baseado na URL fornecida
    const siteUrl = "ctvacinas974.sharepoint.com:/sites/regulatorios";
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteUrl}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async getFolderId(siteId: string) {
    const token = await this.getToken();
    // Busca a pasta Sistema dentro de Documentos (Shared Documents)
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/Sistema`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    return data.id;
  },

  async loadFromCloud() {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const site = await this.getSiteData();
      if (!site.id) return null;

      const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root:/Sistema/db.json:/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 404) return null;
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
      const site = await this.getSiteData();
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
