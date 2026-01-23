
import * as msal from "@azure/msal-browser";

const CLIENT_ID = "ee1975b9-c61a-4ffa-a976-b1cbc7e25cef"; 
const TENANT_ID = "f51c2ea8-6e50-4e8f-a3e3-30c69e99d323";

let msalInstance: msal.PublicClientApplication | null = null;

const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite.All", "Sites.Read.All"]
};

const SHAREPOINT_HOST = "ctvacinas974.sharepoint.com";
const SITE_PATH = "/sites/regulatorios";
const FILE_PATH = "/Sistemas/db.json";

export const MicrosoftGraphService = {
  async init() {
    if (!msalInstance) {
      msalInstance = new msal.PublicClientApplication({
        auth: {
          clientId: CLIENT_ID,
          authority: `https://login.microsoftonline.com/${TENANT_ID}`,
          redirectUri: window.location.origin,
        },
        cache: {
          cacheLocation: "localStorage",
          storeAuthStateInCookie: false,
        }
      });
      await msalInstance.initialize();
    }
    return msalInstance;
  },

  async login() {
    const instance = await this.init();
    try {
      const loginResponse = await instance.loginPopup(loginRequest);
      instance.setActiveAccount(loginResponse.account);
      return { success: true, account: loginResponse.account };
    } catch (error: any) {
      console.error("Erro no login Microsoft:", error);
       if (error.errorMessage?.includes("unauthorized_client") || error.message?.includes("unauthorized_client")) {
        alert("⚠️ ERRO DE PERMISSÃO AZURE:\n\nSua conta pode ser pessoal, mas o aplicativo no Azure pode não estar configurado para aceitá-las. Peça ao administrador para habilitar 'Contas em qualquer diretório organizacional e contas pessoais da Microsoft' no Portal do Azure.");
      } else {
        alert("Ocorreu um erro ao tentar conectar com a Microsoft. Verifique suas permissões de acesso ao SharePoint ou tente novamente mais tarde.");
      }
      return { success: false, error };
    }
  },

  async logout() {
    const instance = await this.init();
    const account = instance.getActiveAccount();
    if (account) {
        await instance.logoutPopup({ account });
    }
    await instance.clearCache();
  },

  async getAccount() {
    const instance = await this.init();
    const accounts = instance.getAllAccounts();
    if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0]);
        return accounts[0];
    }
    return null;
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
       if (error instanceof msal.InteractionRequiredAuthError) {
         try {
            const response = await instance.acquireTokenPopup(loginRequest);
            return response.accessToken;
         } catch (popupError) {
            console.error("Erro ao adquirir token via popup:", popupError);
            return null;
         }
       }
       console.error("Erro ao adquirir token silenciosamente:", error);
       return null;
    }
  },

  async getSiteAndDriveId(token: string) {
    const siteUrl = `${SHAREPOINT_HOST}:${SITE_PATH}`;
    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteUrl}?$select=id,drive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Falha ao buscar Site/Drive: ${response.statusText}`);
      const data = await response.json();
      return { siteId: data.id, driveId: data.drive.id };
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async loadFromCloud() {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return null;
      
      const response = await fetch(`https://graph.microsoft.com/v1.0/drives/${ids.driveId}/root:${FILE_PATH}:/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 404) {
          console.warn("Arquivo 'db.json' não encontrado no SharePoint. Será criado um novo no primeiro salvamento.");
          return null;
      }
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
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return false;

      const body = JSON.stringify(data, null, 2);
      const response = await fetch(`https://graph.microsoft.com/v1.0/drives/${ids.driveId}/root:${FILE_PATH}:/content`, {
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
