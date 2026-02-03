
import { PublicClientApplication, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { Task, Project, TeamMember, ActivityPlanTemplate, ActivityLog, AppUser } from '../types';
import { DEFAULT_ACTIVITY_PLANS, DEFAULT_TEAM_MEMBERS } from '../constants';
import { generateInitialTasks } from '../utils/mockData';

// --- Configuração ---
const msalConfig = {
  auth: {
    clientId: 'INSIRA_SEU_CLIENT_ID_AQUI', // IMPORTANTE: Substitua pelo seu Client ID do Azure App Registration
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

const loginRequest = {
  scopes: ['User.Read', 'Files.ReadWrite.All', 'Sites.Read.All'],
};

// Configurações do SharePoint - NÃO ALTERAR SE NÃO TIVER CERTEZA
const config = {
    siteId: 'ctvacinas.sharepoint.com,b7b71749-3211-4483-9326-78d0f25619a9,1229729a-24a0-4598-944d-58705f427773',
    driveId: 'b!SRe3tzIRg0STJnjQ8lYZqZopcpokpFhJlE1YcF9Cd3Nl54U_r27_R4Yx7o3SFy1B',
    filePath: '/General/AR_DATABASE/database.json' 
};

const graphEndpoint = `https://graph.microsoft.com/v1.0/sites/${config.siteId}/drives/${config.driveId}/root:${config.filePath}`;

// --- Estrutura da Base de Dados ---
interface AppDatabase {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  activityPlans: ActivityPlanTemplate[];
  logs: ActivityLog[];
  appUsers: AppUser[];
}

// --- Serviços ---
class MsalService {
  private msalInstance: PublicClientApplication;
  private initializationPromise: Promise<void>;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
    // A inicialização começa imediatamente. Primeiro, inicialize a instância,
    // depois, lide com qualquer promessa de redirecionamento.
    this.initializationPromise = this.msalInstance.initialize()
      .then(() => {
        return this.msalInstance.handleRedirectPromise();
      })
      .then(() => { /* Garante que a promessa seja resolvida como void */ })
      .catch(err => {
        console.error("Erro de inicialização do MSAL:", err);
      });
  }

  async login(): Promise<void> {
    await this.initializationPromise;
    return this.msalInstance.loginRedirect(loginRequest);
  }

  async logout(): Promise<void> {
    await this.initializationPromise;
    const account = this.getAccountInternal();
    if (account) {
      return this.msalInstance.logoutRedirect({ account });
    }
  }

  private getAccountInternal(): AccountInfo | null {
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  async getAccount(): Promise<AccountInfo | null> {
    await this.initializationPromise;
    return this.getAccountInternal();
  }

  async getToken(): Promise<string | null> {
    await this.initializationPromise;
    const account = this.getAccountInternal();
    if (!account) {
      return null;
    }

    const request = { ...loginRequest, account };

    try {
      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        console.warn("Falha na aquisição silenciosa de token. Redirecionando para login interativo.");
        this.msalInstance.acquireTokenRedirect(request);
        return null;
      }
      console.error('Erro MSAL durante a aquisição de token:', error);
      return null;
    }
  }
}

class GraphService {
  async getDb(accessToken: string): Promise<AppDatabase> {
    try {
      const response = await fetch(`${graphEndpoint}/content`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        return response.json();
      }

      if (response.status === 404) {
        console.warn('Arquivo de banco de dados não encontrado no SharePoint. Criando um padrão.');
        const defaultDb = this.createDefaultDatabase();
        await this.saveDb(accessToken, defaultDb);
        return defaultDb;
      }

      throw new Error(`Erro ao buscar BD: ${response.statusText}`);
    } catch (error) {
      console.error('Falha ao obter BD do SharePoint:', error);
      throw error;
    }
  }

  async saveDb(accessToken: string, data: AppDatabase): Promise<void> {
    try {
      await fetch(`${graphEndpoint}/content`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Falha ao salvar BD no SharePoint:', error);
      throw error;
    }
  }
  
  private createDefaultDatabase(): AppDatabase {
    const team = DEFAULT_TEAM_MEMBERS;
    return {
      tasks: generateInitialTasks(team),
      projects: [],
      teamMembers: team,
      activityPlans: DEFAULT_ACTIVITY_PLANS,
      logs: [],
      appUsers: []
    };
  }
}

export const msalService = new MsalService();
export const graphService = new GraphService();
