
import * as msal from "@azure/msal-browser";

const CLIENT_ID = "609422c2-d648-4b50-b1fe-ca614b77ffb5"; 
const TENANT_ID = "f51c2ea8-6e50-4e8f-a3e3-30c69e99d323";

// Variável para a instância do MSAL já inicializada
let msalInstance: msal.PublicClientApplication | null = null;
// Promise para controlar a inicialização e evitar race conditions
let msalInstancePromise: Promise<msal.PublicClientApplication> | null = null;

const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"]
};

const SHAREPOINT_HOST = "ctvacinas974.sharepoint.com";
const SITE_PATH = "/sites/regulatorios";
const FOLDER_NAME = "sistema";
const FILE_NAME = "db.json";

export const MicrosoftGraphService = {
  async init() {
    // Se a instância já estiver pronta, retorne-a imediatamente.
    if (msalInstance) {
      return msalInstance;
    }

    // Se a inicialização ainda não começou, crie a promise.
    if (!msalInstancePromise) {
      msalInstancePromise = (async () => {
        const instance = new msal.PublicClientApplication({
          auth: {
            clientId: CLIENT_ID,
            authority: `https://login.microsoftonline.com/${TENANT_ID}`,
            redirectUri: window.location.origin,
          },
          cache: {
            cacheLocation: "localStorage",
          }
        });
        await instance.initialize();
        // Após a inicialização, armazene a instância e a retorne.
        msalInstance = instance;
        return instance;
      })();
    }
    
    // Aguarde a promise de inicialização (seja a que foi criada agora ou uma já existente).
    return await msalInstancePromise;
  },

  async login() {
    const instance = await this.init();
    try {
      const loginResponse = await instance.loginPopup({
        ...loginRequest,
        prompt: "select_account"
      });
      instance.setActiveAccount(loginResponse.account);
      return { success: true, account: loginResponse.account };
    } catch (error: any) {
      if (error instanceof msal.BrowserAuthError && error.errorCode === 'user_cancelled') {
        console.log('Login cancelado pelo usuário.');
        return { success: false, error: null }; 
      }
      console.error("Erro no login Microsoft:", error);
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
            return null;
         }
       }
       return null;
    }
  },

  async getSiteAndDriveId(token: string) {
    try {
      const siteRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_HOST}:${SITE_PATH}?$select=id`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!siteRes.ok) {
        const err = await siteRes.json();
        console.error("Erro Site:", err);
        throw new Error("Site não encontrado ou sem permissão");
      }
      const siteData = await siteRes.json();
      
      const driveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/drive?$select=id`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!driveRes.ok) throw new Error("Drive não encontrado");
      const driveData = await driveRes.json();

      return { siteId: siteData.id, driveId: driveData.id };
    } catch (e) {
      console.error("Erro ao buscar metadados SharePoint:", e);
      return null;
    }
  },

  async ensureFolderExists(token: string, driveId: string) {
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: FOLDER_NAME,
          folder: {},
          "@microsoft.graph.conflictBehavior": "fail" 
        })
      });
      
      if (res.status === 409) return true; 
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async loadFromCloud() {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return null;
      
      const response = await fetch(`https://graph.microsoft.com/v1.0/drives/${ids.driveId}/root:/${FOLDER_NAME}/${FILE_NAME}:/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Erro SharePoint");
      return await response.json();
    } catch (error) {
      console.error("Erro carregar:", error);
      throw error;
    }
  },

  async saveToCloud(data: any) {
    const token = await this.getToken();
    if (!token) return false;

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return false;

      const folderExists = await this.ensureFolderExists(token, ids.driveId);
      if (!folderExists) {
        console.error("A pasta 'sistema' não pôde ser encontrada ou criada no SharePoint.");
        return false;
      }

      const body = JSON.stringify(data, null, 2);
      const url = `https://graph.microsoft.com/v1.0/drives/${ids.driveId}/root:/${FOLDER_NAME}/${FILE_NAME}:/content`;
      
      const response = await fetch(url, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: body
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Falha no upload:", err);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Falha salvamento:", error);
      return false;
    }
  }
};
