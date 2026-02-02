import * as msal from "@azure/msal-browser";

const CLIENT_ID = "609422c2-d648-4b50-b1fe-ca614b77ffb5"; 
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
       if (error.errorCode === 'unauthorized_client' || error.errorMessage?.includes('AADSTS65005')) {
        alert("⚠️ Acesso Negado ou Permissão Necessária\n\nNão foi possível fazer o login. Possíveis causas:\n\n1. Você está usando uma conta pessoal (@outlook, @gmail) em vez da sua conta corporativa (@ctvacinas.org).\n2. O aplicativo precisa de permissão de um administrador de TI para acessar o SharePoint.\n\nPor favor, tente novamente com sua conta corporativa. Se o erro continuar, contate o suporte de TI e solicite a aprovação para o aplicativo 'Gestão de Atividades PAR'.");
      } else if (error.errorCode === 'user_cancelled') {
        console.log("Login cancelado pelo usuário.");
      }
      else {
        alert("Ocorreu um erro inesperado durante o login. Por favor, verifique sua conexão e tente novamente. Se o problema persistir, contate o suporte.");
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
    if (!token) {
      return { data: null, error: 'token_error' };
    }

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) {
        return { data: null, error: 'permission_denied' };
      }
      
      const response = await fetch(`https://graph.microsoft.com/v1.0/drives/${ids.driveId}/root:${FILE_PATH}:/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 404) {
          console.warn("Arquivo 'db.json' não encontrado no SharePoint. Será criado um novo no primeiro salvamento.");
          return { data: null, error: null };
      }
      if (!response.ok) {
        return { data: null, error: 'fetch_error' };
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Erro ao carregar do SharePoint:", error);
      return { data: null, error: 'permission_denied' };
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