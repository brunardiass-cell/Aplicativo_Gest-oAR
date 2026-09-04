
import * as msal from "@azure/msal-browser";
import {
  generateMonthlyTasksWorkbook,
  generateProjectsWorkbook,
  generateRegulatoryWorkbook,
  generateVaccinesWorkbook,
  uploadExcelToSharePointPath,
  downloadWorkbookAsFile
} from "../utils/excelReports";

const CLIENT_ID = "609422c2-d648-4b50-b1fe-ca614b77ffb5"; 
const TENANT_ID = "f51c2ea8-6e50-4e8f-a3e3-30c69e99d323";

export interface SPMetadataItem {
  spItemId: string;
  eTag: string;
}

export type SPMetadataMap = Record<string, Record<string, SPMetadataItem>>;

// Cache local de IDs de listas do SharePoint
const listIdCache: Record<string, string> = {};

// Variável para a instância do MSAL já inicializada
let msalInstance: msal.PublicClientApplication | null = null;
// Promise para controlar a inicialização e evitar race conditions
let msalInstancePromise: Promise<msal.PublicClientApplication> | null = null;

const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite", "Sites.ReadWrite.All", "Mail.Send"]
};

const SHAREPOINT_HOST = "ctvacinas974.sharepoint.com";
const SITE_PATH = "/sites/regulatorios";
const FOLDER_NAME = "Sistema";
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
        try {
          const redirectRes = await instance.handleRedirectPromise();
          if (redirectRes?.account) {
            instance.setActiveAccount(redirectRes.account);
          }
        } catch (e) {
          console.warn("MSAL redirect promise warning:", e);
        }
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
    if (account && !account.homeAccountId?.startsWith('sp_')) {
      try {
        await instance.logoutPopup({ account });
      } catch (e) {
        console.warn('Erro ao deslogar MSAL:', e);
      }
    }
    try {
      await instance.clearCache();
    } catch (e) {}
    localStorage.removeItem('ct_sharepoint_active_user');
    sessionStorage.removeItem('ct_sharepoint_active_user');
  },

  async getAccount() {
    const instance = await this.init();
    const active = instance.getActiveAccount();
    if (active) return active;
    const accounts = instance.getAllAccounts();
    if (accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
      return accounts[0];
    }
    return null;
  },

  async attemptSilentLogin(loginHint?: string) {
    try {
      const instance = await this.init();
      const existing = await this.getAccount();
      if (existing) return existing;

      const silentReq: any = {
        ...loginRequest,
      };
      if (loginHint) {
        silentReq.loginHint = loginHint;
      }
      const ssoRes = await instance.ssoSilent(silentReq);
      if (ssoRes?.account) {
        instance.setActiveAccount(ssoRes.account);
        return ssoRes.account;
      }
    } catch (e) {
      console.log('Tentativa de SSO silencioso via SharePoint/M365:', e);
    }
    return null;
  },

  isSharePointEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const hasSpParam = urlParams.has('sharepoint') || urlParams.has('sp') || urlParams.get('source') === 'sharepoint' || urlParams.has('spUser');
    const isReferrerFromSp = typeof document !== 'undefined' && /ctvacinas974\.sharepoint\.com|sharepoint\.com/i.test(document.referrer || '');
    const isIframe = window.self !== window.top;
    const hasSavedSpSession = !!localStorage.getItem('ct_sharepoint_active_user');
    return hasSpParam || isReferrerFromSp || isIframe || hasSavedSpSession;
  },

  getSharePointUrlParams(): { email?: string; username?: string; isSharePoint: boolean } {
    if (typeof window === 'undefined') return { isSharePoint: false };
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || urlParams.get('spUser') || urlParams.get('user') || urlParams.get('upn') || urlParams.get('login_hint') || undefined;
    const username = urlParams.get('name') || urlParams.get('username') || undefined;
    const isSharePoint = this.isSharePointEnvironment();
    return { email, username, isSharePoint };
  },

  createSharePointAccount(user: { id: string; username: string; email: string }) {
    return {
      homeAccountId: `sp_${user.id}`,
      environment: 'login.microsoftonline.com',
      tenantId: TENANT_ID,
      username: user.email,
      localAccountId: user.id,
      name: user.username,
      idTokenClaims: {
        name: user.username,
        email: user.email,
        preferred_username: user.email,
        upn: user.email,
        tid: TENANT_ID
      }
    };
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
      const siteRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_HOST}:${SITE_PATH}?$select=id,name,webUrl`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!siteRes.ok) {
        const err = await siteRes.json().catch(() => ({}));
        console.error("Erro Site:", err);
        throw new Error("Site não encontrado ou sem permissão");
      }
      const siteData = await siteRes.json();

      // Busca todas as bibliotecas de documentos (drives) do site para encontrar 'Documentos'
      let selectedDriveId = '';
      try {
        const drivesRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/drives?$select=id,name,webUrl,driveType`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (drivesRes.ok) {
          const drivesData = await drivesRes.json();
          const drives = drivesData.value || [];
          
          // 1. Tenta encontrar a biblioteca de 'Documentos' / 'Shared Documents'
          const docLib = drives.find((d: any) => 
            d.name === 'Documentos' || 
            d.name === 'Documentos compartilhados' || 
            d.name === 'Shared Documents' || 
            d.name === 'Documents' ||
            (d.webUrl && (d.webUrl.includes('/Shared Documents') || d.webUrl.includes('/Documentos')))
          );

          if (docLib) {
            selectedDriveId = docLib.id;
          } else if (drives.length > 0) {
            selectedDriveId = drives[0].id;
          }
        }
      } catch (driveLookupErr) {
        console.warn("Aviso na busca de drives:", driveLookupErr);
      }
      
      // Fallback para o drive padrão se não encontrou pela lista
      if (!selectedDriveId) {
        const driveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/drive?$select=id`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!driveRes.ok) throw new Error("Drive não encontrado");
        const driveData = await driveRes.json();
        selectedDriveId = driveData.id;
      }

      return { siteId: siteData.id, driveId: selectedDriveId };
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

  // --- SHAREPOINT LISTS HELPER METHODS ---

  async getListId(token: string, siteId: string, listDisplayName: string): Promise<string | null> {
    if (listIdCache[listDisplayName]) return listIdCache[listDisplayName];

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists?$select=id,displayName`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      const found = data.value?.find((l: any) => l.displayName === listDisplayName);
      if (found) {
        listIdCache[listDisplayName] = found.id;
        return found.id;
      }

      // Lista não existe no SharePoint. Criar a lista com colunas padrão de texto.
      const createRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: listDisplayName,
          columns: [
            { name: 'RecordId', text: {} },
            { name: 'Payload', text: { allowMultipleLines: true } },
            { name: 'UpdatedBy', text: {} },
            { name: 'UpdatedAt', text: {} }
          ],
          list: { template: 'genericList' }
        })
      });

      if (createRes.ok) {
        const created = await createRes.json();
        listIdCache[listDisplayName] = created.id;
        return created.id;
      } else {
        const fallbackCreate = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            displayName: listDisplayName,
            list: { template: 'genericList' }
          })
        });
        if (fallbackCreate.ok) {
          const fallbackCreated = await fallbackCreate.json();
          listIdCache[listDisplayName] = fallbackCreated.id;
          return fallbackCreated.id;
        }
      }
    } catch (e) {
      console.error(`Erro ao verificar/criar SharePoint List ${listDisplayName}:`, e);
    }
    return null;
  },

  async getListItems(token: string, siteId: string, listId: string) {
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=999`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.value || [];
    } catch (e) {
      console.error("Erro ao carregar itens da lista:", e);
      return [];
    }
  },

  async createListItem(token: string, siteId: string, listId: string, recordId: string, payload: any, user: string) {
    const fields: Record<string, any> = {
      Title: String(recordId),
      RecordId: String(recordId),
      Payload: JSON.stringify(payload),
      UpdatedBy: user || 'Sistema',
      UpdatedAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Erro ao criar item na lista do SharePoint:', err);
        return null;
      }

      const created = await res.json();
      return {
        spItemId: created.id,
        eTag: created.eTag || created['@odata.etag'] || ''
      };
    } catch (e) {
      console.error('Exceção ao criar item na SharePoint List:', e);
      return null;
    }
  },

  async updateListItem(token: string, siteId: string, listId: string, spItemId: string, recordId: string, payload: any, eTag: string, user: string) {
    const fields: Record<string, any> = {
      Title: String(recordId),
      RecordId: String(recordId),
      Payload: JSON.stringify(payload),
      UpdatedBy: user || 'Sistema',
      UpdatedAt: new Date().toISOString()
    };

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    if (eTag) {
      headers['If-Match'] = eTag;
    }

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${spItemId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields })
      });

      if (res.status === 412) {
        console.warn(`Conflito de versão detectado (412) ao atualizar item ${recordId} na lista ${listId}`);
        return { success: false, conflict: true };
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Erro ao atualizar item na lista do SharePoint:', err);
        return { success: false, conflict: false };
      }

      const updated = await res.json();
      return {
        success: true,
        conflict: false,
        newETag: updated.eTag || updated['@odata.etag'] || ''
      };
    } catch (e) {
      console.error('Exceção ao atualizar item na SharePoint List:', e);
      return { success: false, conflict: false };
    }
  },

  async deleteListItem(token: string, siteId: string, listId: string, spItemId: string, eTag: string) {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`
    };

    if (eTag) {
      headers['If-Match'] = eTag;
    }

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${spItemId}`, {
        method: 'DELETE',
        headers
      });

      if (res.status === 412) {
        return { success: false, conflict: true };
      }

      if (!res.ok && res.status !== 204) {
        return { success: false, conflict: false };
      }

      return { success: true, conflict: false };
    } catch (e) {
      console.error('Exceção ao apagar item da SharePoint List:', e);
      return { success: false, conflict: false };
    }
  },

  async seedSharePointLists(token: string, siteId: string, cloudData: any, spMetadataMap: SPMetadataMap) {
    const seedArray = async (listName: string, items: any[], getId: (item: any) => string) => {
      const listId = await this.getListId(token, siteId, listName);
      if (!listId) return;
      spMetadataMap[listName] = spMetadataMap[listName] || {};
      for (const item of items) {
        const recId = getId(item);
        if (!recId) continue;
        const created = await this.createListItem(token, siteId, listId, recId, item, 'Sistema');
        if (created) {
          spMetadataMap[listName][recId] = created;
        }
      }
    };

    await seedArray('CT_Projects', cloudData.projects || [], p => p.id);
    await seedArray('CT_Tasks', cloudData.tasks || [], t => t.id);
    await seedArray('CT_RegulatoryStandards', cloudData.regulatoryStandards || [], s => s.id);
    await seedArray('CT_RegulatorySubjects', cloudData.regulatorySubjects || [], s => s.id);
    await seedArray('CT_VaccineCandidates', cloudData.vaccineCandidates || [], c => c.id);
    await seedArray('CT_VaccineComponents', cloudData.vaccineComponents || [], c => c.id);
    await seedArray('CT_FormulationBatches', cloudData.formulationBatches || [], b => b.id);
    await seedArray('CT_RegulatoryEvidence', cloudData.regulatoryEvidence || [], e => e.id);
    await seedArray('CT_MacroActivityConfigs', cloudData.macroActivityConfigs || [], m => m.id);
    await seedArray('CT_RegulatoryInfoItems', cloudData.regulatoryInfoItems || [], i => i.id);
    await seedArray('CT_RepeatableRecords', cloudData.repeatableRecords || [], r => r.id);
    await seedArray('CT_RegulatoryNarratives', cloudData.regulatoryNarratives || [], n => n.id);
    await seedArray('CT_RegulatoryDocs', cloudData.regulatoryDocs || [], d => d.id);

    const configListId = await this.getListId(token, siteId, 'CT_AppConfig');
    if (configListId) {
      spMetadataMap['CT_AppConfig'] = spMetadataMap['CT_AppConfig'] || {};
      const configKeys = ['teamMembers', 'activityPlans', 'appUsers', 'managerEmail', 'notifications', 'logs'];
      for (const key of configKeys) {
        if (cloudData[key] !== undefined) {
          const created = await this.createListItem(token, siteId, configListId, key, cloudData[key], 'Sistema');
          if (created) {
            spMetadataMap['CT_AppConfig'][key] = created;
          }
        }
      }
    }
  },

  async loadFromSharePointLists(): Promise<{ data: any; spMetadataMap: SPMetadataMap; version?: string } | null> {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return null;

      const siteId = ids.siteId;
      const listNames = [
        'CT_Projects',
        'CT_Tasks',
        'CT_RegulatoryStandards',
        'CT_RegulatorySubjects',
        'CT_VaccineCandidates',
        'CT_VaccineComponents',
        'CT_FormulationBatches',
        'CT_RegulatoryEvidence',
        'CT_MacroActivityConfigs',
        'CT_RegulatoryInfoItems',
        'CT_RepeatableRecords',
        'CT_RegulatoryNarratives',
        'CT_RegulatoryDocs',
        'CT_AppConfig'
      ];

      const spMetadataMap: SPMetadataMap = {};
      const loadedCollections: Record<string, any> = {};

      let hasAnyListItems = false;

      for (const listName of listNames) {
        spMetadataMap[listName] = {};
        const listId = await this.getListId(token, siteId, listName);
        if (!listId) continue;

        const items = await this.getListItems(token, siteId, listId);
        if (items.length > 0) {
          hasAnyListItems = true;
        }

        if (listName === 'CT_AppConfig') {
          const configObj: Record<string, any> = {};
          for (const item of items) {
            const recId = item.fields?.RecordId || item.fields?.Title;
            const payloadStr = item.fields?.Payload;
            if (recId && payloadStr) {
              try {
                configObj[recId] = JSON.parse(payloadStr);
                spMetadataMap[listName][recId] = {
                  spItemId: item.id,
                  eTag: item.eTag || item['@odata.etag'] || ''
                };
              } catch (e) {
                console.error(`Erro ao parsear configuração ${recId}:`, e);
              }
            }
          }
          loadedCollections['CT_AppConfig'] = configObj;
        } else {
          const arrayItems: any[] = [];
          for (const item of items) {
            const recId = item.fields?.RecordId || item.fields?.Title;
            const payloadStr = item.fields?.Payload;
            if (payloadStr) {
              try {
                const parsed = JSON.parse(payloadStr);
                arrayItems.push(parsed);
                if (recId) {
                  spMetadataMap[listName][recId] = {
                    spItemId: item.id,
                    eTag: item.eTag || item['@odata.etag'] || ''
                  };
                }
              } catch (e) {
                console.error(`Erro ao parsear item em ${listName}:`, e);
              }
            }
          }
          loadedCollections[listName] = arrayItems;
        }
      }

      // Se as listas estiverem vazias (primeiro carregamento das listas), lê o db.json do OneDrive e faz o seeding inicial
      if (!hasAnyListItems) {
        console.log('Listas do SharePoint vazias. Carregando db.json do armazenamento e populando as listas...');
        const cloudResult = await this.loadFromCloud();
        if (!cloudResult || !cloudResult.data) return null;

        const cloudData = cloudResult.data;
        await this.seedSharePointLists(token, siteId, cloudData, spMetadataMap);

        return {
          data: cloudData,
          spMetadataMap,
          version: cloudResult.version
        };
      }

      const appConfig = loadedCollections['CT_AppConfig'] || {};

      const fullData = {
        projects: loadedCollections['CT_Projects'] || [],
        tasks: loadedCollections['CT_Tasks'] || [],
        regulatoryStandards: loadedCollections['CT_RegulatoryStandards'] || [],
        regulatorySubjects: loadedCollections['CT_RegulatorySubjects'] || [],
        vaccineCandidates: loadedCollections['CT_VaccineCandidates'] || [],
        vaccineComponents: loadedCollections['CT_VaccineComponents'] || [],
        formulationBatches: loadedCollections['CT_FormulationBatches'] || [],
        regulatoryEvidence: loadedCollections['CT_RegulatoryEvidence'] || [],
        macroActivityConfigs: loadedCollections['CT_MacroActivityConfigs'] || [],
        regulatoryInfoItems: loadedCollections['CT_RegulatoryInfoItems'] || [],
        repeatableRecords: loadedCollections['CT_RepeatableRecords'] || [],
        regulatoryNarratives: loadedCollections['CT_RegulatoryNarratives'] || [],
        regulatoryDocs: loadedCollections['CT_RegulatoryDocs'] || [],
        teamMembers: appConfig.teamMembers,
        activityPlans: appConfig.activityPlans,
        appUsers: appConfig.appUsers,
        managerEmail: appConfig.managerEmail,
        notifications: appConfig.notifications,
        logs: appConfig.logs
      };

      return {
        data: fullData,
        spMetadataMap
      };
    } catch (error) {
      console.error("Erro ao carregar dados das SharePoint Lists:", error);
      return null;
    }
  },

  async saveGranularToSharePoint(
    previousData: any,
    newData: any,
    spMetadataMap: SPMetadataMap,
    user: string
  ): Promise<{ success: boolean; conflict?: boolean; spMetadataMap?: SPMetadataMap; error?: string }> {
    const token = await this.getToken();
    if (!token) return { success: false, conflict: false };

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return { success: false, conflict: false };
      const siteId = ids.siteId;

      const updatedMetadataMap: SPMetadataMap = JSON.parse(JSON.stringify(spMetadataMap || {}));

      const collectionsMapping: { listName: string; prevArray: any[]; newArray: any[]; getId: (i: any) => string }[] = [
        { listName: 'CT_Projects', prevArray: previousData?.projects || [], newArray: newData?.projects || [], getId: i => i.id },
        { listName: 'CT_Tasks', prevArray: previousData?.tasks || [], newArray: newData?.tasks || [], getId: i => i.id },
        { listName: 'CT_RegulatoryStandards', prevArray: previousData?.regulatoryStandards || [], newArray: newData?.regulatoryStandards || [], getId: i => i.id },
        { listName: 'CT_RegulatorySubjects', prevArray: previousData?.regulatorySubjects || [], newArray: newData?.regulatorySubjects || [], getId: i => i.id },
        { listName: 'CT_VaccineCandidates', prevArray: previousData?.vaccineCandidates || [], newArray: newData?.vaccineCandidates || [], getId: i => i.id },
        { listName: 'CT_VaccineComponents', prevArray: previousData?.vaccineComponents || [], newArray: newData?.vaccineComponents || [], getId: i => i.id },
        { listName: 'CT_FormulationBatches', prevArray: previousData?.formulationBatches || [], newArray: newData?.formulationBatches || [], getId: i => i.id },
        { listName: 'CT_RegulatoryEvidence', prevArray: previousData?.regulatoryEvidence || [], newArray: newData?.regulatoryEvidence || [], getId: i => i.id },
        { listName: 'CT_MacroActivityConfigs', prevArray: previousData?.macroActivityConfigs || [], newArray: newData?.macroActivityConfigs || [], getId: i => i.id },
        { listName: 'CT_RegulatoryInfoItems', prevArray: previousData?.regulatoryInfoItems || [], newArray: newData?.regulatoryInfoItems || [], getId: i => i.id },
        { listName: 'CT_RepeatableRecords', prevArray: previousData?.repeatableRecords || [], newArray: newData?.repeatableRecords || [], getId: i => i.id },
        { listName: 'CT_RegulatoryNarratives', prevArray: previousData?.regulatoryNarratives || [], newArray: newData?.regulatoryNarratives || [], getId: i => i.id },
        { listName: 'CT_RegulatoryDocs', prevArray: previousData?.regulatoryDocs || [], newArray: newData?.regulatoryDocs || [], getId: i => i.id },
      ];

      for (const mapping of collectionsMapping) {
        const { listName, prevArray, newArray, getId } = mapping;
        const listId = await this.getListId(token, siteId, listName);
        if (!listId) continue;

        updatedMetadataMap[listName] = updatedMetadataMap[listName] || {};

        const prevMap = new Map<string, any>();
        prevArray.forEach(item => { const id = getId(item); if (id) prevMap.set(id, item); });

        const newMap = new Map<string, any>();
        newArray.forEach(item => { const id = getId(item); if (id) newMap.set(id, item); });

        // Itens criados ou modificados
        for (const [id, item] of newMap.entries()) {
          const prevItem = prevMap.get(id);
          const meta = updatedMetadataMap[listName][id];

          if (!prevItem || !meta) {
            // Novo item na coleção
            const created = await this.createListItem(token, siteId, listId, id, item, user);
            if (created) {
              updatedMetadataMap[listName][id] = created;
            }
          } else if (JSON.stringify(item) !== JSON.stringify(prevItem)) {
            // Item modificado - envia atualização granular apenas para este registro
            const updateRes = await this.updateListItem(token, siteId, listId, meta.spItemId, id, item, meta.eTag, user);
            if (updateRes.conflict) {
              return { success: false, conflict: true, error: 'Conflito de versão detectado no SharePoint.' };
            }
            if (updateRes.success && updateRes.newETag) {
              updatedMetadataMap[listName][id].eTag = updateRes.newETag;
            }
          }
        }

        // Itens excluídos
        for (const [id, prevItem] of prevMap.entries()) {
          if (!newMap.has(id)) {
            const meta = updatedMetadataMap[listName][id];
            if (meta) {
              const delRes = await this.deleteListItem(token, siteId, listId, meta.spItemId, meta.eTag);
              if (delRes.conflict) {
                return { success: false, conflict: true, error: 'Conflito de versão ao excluir item.' };
              }
              delete updatedMetadataMap[listName][id];
            }
          }
        }
      }

      // Processa seções de AppConfig
      const configKeys = ['teamMembers', 'activityPlans', 'appUsers', 'managerEmail', 'notifications', 'logs'];
      const configListId = await this.getListId(token, siteId, 'CT_AppConfig');
      if (configListId) {
        updatedMetadataMap['CT_AppConfig'] = updatedMetadataMap['CT_AppConfig'] || {};
        for (const key of configKeys) {
          const prevVal = previousData?.[key];
          const newVal = newData?.[key];
          const meta = updatedMetadataMap['CT_AppConfig'][key];

          if (newVal !== undefined && (prevVal === undefined || !meta)) {
            const created = await this.createListItem(token, siteId, configListId, key, newVal, user);
            if (created) {
              updatedMetadataMap['CT_AppConfig'][key] = created;
            }
          } else if (newVal !== undefined && JSON.stringify(prevVal) !== JSON.stringify(newVal)) {
            const updateRes = await this.updateListItem(token, siteId, configListId, meta.spItemId, key, newVal, meta.eTag, user);
            if (updateRes.conflict) {
              return { success: false, conflict: true, error: 'Conflito de versão detectado na configuração.' };
            }
            if (updateRes.success && updateRes.newETag) {
              updatedMetadataMap['CT_AppConfig'][key].eTag = updateRes.newETag;
            }
          }
        }
      }

      // Gera/atualiza automaticamente o arquivo de backup completo db.json no SharePoint Drive
      const backupRes = await this.saveToCloud(newData, null);
      if (!backupRes.success) {
        console.warn("Aviso: Falha ao gerar arquivo de backup db.json, porém as listas do SharePoint foram atualizadas com sucesso.");
      }

      return {
        success: true,
        conflict: false,
        spMetadataMap: updatedMetadataMap
      };
    } catch (error) {
      console.error("Erro ao salvar no SharePoint Lists:", error);
      return { success: false, conflict: false };
    }
  },

  async loadFromCloud() {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return null;

      const itemResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${ids.driveId}/root:/${FOLDER_NAME}/${FILE_NAME}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (itemResponse.status === 404) {
        return null; 
      }
      if (!itemResponse.ok) {
        throw new Error('Falha ao obter metadados do arquivo do SharePoint.');
      }

      const itemData = await itemResponse.json();
      const downloadUrl = itemData['@microsoft.graph.downloadUrl'];
      const version = itemData.eTag;

      if (!downloadUrl || !version) {
        throw new Error('URL de download ou eTag não encontrados nos metadados do arquivo.');
      }

      const contentResponse = await fetch(downloadUrl);
      if (!contentResponse.ok) {
        throw new Error('Falha ao baixar o conteúdo do arquivo.');
      }
      
      const data = await contentResponse.json();

      return { data, version };
    } catch (error) {
      console.error("Erro ao carregar dados do SharePoint:", error);
      throw error;
    }
  },

  async saveToCloud(data: any, version: string | null) {
    const token = await this.getToken();
    if (!token) return { success: false, conflict: false };

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return { success: false, conflict: false };

      await this.ensureFolderExists(token, ids.driveId);

      const url = `https://graph.microsoft.com/v1.0/drives/${ids.driveId}/root:/${FOLDER_NAME}/${FILE_NAME}:/content`;
      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      if (version) {
        headers['If-Match'] = version;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data, null, 2),
      });

      if (response.status === 412) {
        console.warn('Conflito de versão detectado. O salvamento foi abortado.');
        return { success: false, conflict: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Falha ao salvar no SharePoint:', errorData);
        return { success: false, conflict: false };
      }

      const responseData = await response.json();
      const newVersion = responseData.eTag;

      return { success: true, conflict: false, newVersion };
    } catch (error) {
      console.error('Erro inesperado ao salvar no SharePoint:', error);
      return { success: false, conflict: false };
    }
  },

  async getCloudVersion() {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return null;

      const response = await fetch(`https://graph.microsoft.com/v1.0/drives/${ids.driveId}/root:/${FOLDER_NAME}/${FILE_NAME}?$select=eTag`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Falha ao obter a versão do arquivo do SharePoint.');
      }

      const data = await response.json();
      return data.eTag || null;

    } catch (error) {
      console.error("Erro ao verificar a versão do arquivo no SharePoint:", error);
      return null;
    }
  },

  async sendEmail(to: string, subject: string, bodyContent: string) {
    const token = await this.getToken();
    if (!token) {
      console.warn("Microsoft Graph: Não foi possível obter o token de acesso para enviar o e-mail.");
      return false;
    }

    try {
      const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            subject: subject,
            body: {
              contentType: "Text",
              content: bodyContent
            },
            toRecipients: [
              {
                emailAddress: {
                  address: to
                }
              }
            ]
          },
          saveToSentItems: "true"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Microsoft Graph: Erro ao enviar e-mail", errorData);
        return false;
      }

      console.log(`Microsoft Graph: E-mail enviado com sucesso para ${to}`);
      return true;
    } catch (e) {
      console.error("Microsoft Graph: Exceção ao enviar e-mail", e);
      return false;
    }
  },

  async syncProfileSpreadsheetsToSharePoint(data: any): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    const token = await this.getToken();
    if (!token) return { success: false, syncedCount: 0, errors: ['Não autenticado no Microsoft Graph'] };

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return { success: false, syncedCount: 0, errors: ['Site ou Drive do SharePoint não encontrados'] };

      const teamMembers: any[] = data.teamMembers || [];
      const tasks: any[] = data.tasks || [];
      const projects: any[] = data.projects || [];
      const regulatoryEvidence: any[] = data.regulatoryEvidence || [];
      const regulatoryStandards: any[] = data.regulatoryStandards || [];
      const regulatoryDocs: any[] = data.regulatoryDocs || [];
      const dossierContributions: any[] = data.dossierContributions || [];

      await this.ensureFolderExists(token, ids.driveId);

      const errors: string[] = [];
      let syncedCount = 0;

      for (const member of teamMembers) {
        if (!member || !member.name) continue;
        const isDiscontinued = member.active === false || member.discontinued === true;
        const cleanName = member.name.trim();
        const safeFolderName = cleanName.replace(/[/\\?%*:|"<>]/g, '-');
        const baseFolder = isDiscontinued 
          ? `${FOLDER_NAME}/perfis antigos/${safeFolderName}` 
          : `${FOLDER_NAME}/${safeFolderName}`;

        try {
          const wbTasks = generateMonthlyTasksWorkbook(member, tasks, projects);
          const wbProjects = generateProjectsWorkbook(member, projects);
          const wbRegulatory = generateRegulatoryWorkbook(member, projects, tasks, regulatoryEvidence, regulatoryStandards, regulatoryDocs, dossierContributions);

          const fileSuffix = safeFolderName.replace(/\s+/g, '_');
          const res1 = await uploadExcelToSharePointPath(token, ids.driveId, baseFolder, `Atividades_do_Mes_${fileSuffix}.xlsx`, wbTasks);
          const res2 = await uploadExcelToSharePointPath(token, ids.driveId, baseFolder, `Projetos_e_Atividades_${fileSuffix}.xlsx`, wbProjects);
          const res3 = await uploadExcelToSharePointPath(token, ids.driveId, baseFolder, `Documentos_Regulatorios_${fileSuffix}.xlsx`, wbRegulatory);

          if (res1.success && res2.success && res3.success) {
            syncedCount++;
          } else {
            if (!res1.success) errors.push(`[${member.name}] Atividades do Mês: ${res1.error}`);
            if (!res2.success) errors.push(`[${member.name}] Projetos e Atividades: ${res2.error}`);
            if (!res3.success) errors.push(`[${member.name}] Documentos Regulatórios: ${res3.error}`);
          }
        } catch (memErr: any) {
          console.error(`Erro ao gerar planilhas para ${member.name}:`, memErr);
          errors.push(`[${member.name}] ${memErr.message}`);
        }
      }

      return {
        success: errors.length === 0,
        syncedCount,
        errors
      };
    } catch (e: any) {
      console.error('Erro na sincronização de planilhas por perfil:', e);
      return { success: false, syncedCount: 0, errors: [e.message] };
    }
  },

  // =========================================================================
  // NOVA ESTRUTURA MODULAR NO SHAREPOINT:
  // Documentos > Sistema > {Modulo} > perfis > {Nome}
  // =========================================================================

  async ensureSharePointFolderPath(token: string, driveId: string, fullPath: string): Promise<boolean> {
    try {
      const parts = fullPath.replace(/\/+/g, '/').replace(/^\/|\/$/g, '').split('/');
      let currentPath = '';

      for (const part of parts) {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        const endpoint = parentPath 
          ? `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${parentPath}:/children`
          : `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: part,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail'
          })
        });

        if (res.status === 409 || res.ok) {
          continue;
        }
      }
      return true;
    } catch (e) {
      console.warn(`Aviso ao criar pasta SharePoint '${fullPath}':`, e);
      return false;
    }
  },

  async downloadJsonFromSharePointPath(token: string, driveId: string, folderPath: string, fileName: string): Promise<{ data: any; eTag: string } | null> {
    try {
      const sanitizedFolder = folderPath.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${sanitizedFolder}/${fileName}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 404) return null;
      if (!res.ok) return null;

      const itemData = await res.json();
      const downloadUrl = itemData['@microsoft.graph.downloadUrl'];
      const eTag = itemData.eTag || itemData['@odata.etag'] || '';

      if (!downloadUrl) return null;

      const contentRes = await fetch(downloadUrl);
      if (!contentRes.ok) return null;

      const data = await contentRes.json();
      return { data, eTag };
    } catch (e) {
      console.error(`Erro ao baixar JSON ${fileName} de ${folderPath}:`, e);
      return null;
    }
  },

  async uploadJsonWithRetry(
    token: string,
    driveId: string,
    folderPath: string,
    fileName: string,
    data: any,
    initialETag?: string
  ): Promise<{ success: boolean; newETag?: string; conflict?: boolean; error?: string }> {
    const sanitizedFolder = folderPath.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
    await this.ensureSharePointFolderPath(token, driveId, sanitizedFolder);

    let currentETag = initialETag;
    let payload = data;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${sanitizedFolder}/${fileName}:/content`;
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        if (currentETag) {
          headers['If-Match'] = currentETag;
        }

        const res = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload, null, 2)
        });

        if (res.status === 412) {
          console.warn(`[Concorrência] Conflito 412 detectado em ${sanitizedFolder}/${fileName}. Tentativa ${attempt} de 3. Reconciliando dados remotos...`);
          const remote = await this.downloadJsonFromSharePointPath(token, driveId, sanitizedFolder, fileName);
          if (remote && remote.data) {
            currentETag = remote.eTag;
            // Mescla inteligente: preserva novos itens locais e atualizações mantendo integridade
            if (Array.isArray(payload) && Array.isArray(remote.data)) {
              const mergedMap = new Map<string, any>();
              remote.data.forEach((item: any) => { if (item.id) mergedMap.set(item.id, item); });
              payload.forEach((item: any) => { if (item.id) mergedMap.set(item.id, item); });
              payload = Array.from(mergedMap.values());
            } else if (typeof payload === 'object' && typeof remote.data === 'object') {
              payload = { ...remote.data, ...payload };
            }
            continue;
          }
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, conflict: false, error: err?.error?.message || 'Falha ao salvar JSON' };
        }

        const resData = await res.json();
        return {
          success: true,
          conflict: false,
          newETag: resData.eTag || resData['@odata.etag'] || ''
        };
      } catch (err: any) {
        if (attempt === 3) {
          return { success: false, conflict: false, error: err.message };
        }
      }
    }

    return { success: false, conflict: true, error: 'Excedido limite de tentativas de reconciliação de concorrência' };
  },

  // Salva os dados na nova estrutura modular com persistência isolada por módulo/perfil
  async saveModularToSharePoint(
    fullData: any,
    fileETagsMap: Record<string, string> = {}
  ): Promise<{ success: boolean; updatedETags: Record<string, string>; errors: string[] }> {
    const token = await this.getToken();
    if (!token) return { success: false, updatedETags: {}, errors: ['Não autenticado'] };

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return { success: false, updatedETags: {}, errors: ['Site ou Drive não encontrados'] };

      const updatedETags: Record<string, string> = { ...fileETagsMap };
      const errors: string[] = [];
      const timestamp = new Date().toISOString();
      const currentUser = fullData.lastEditor || 'Sistema';

      // -----------------------------------------------------------------------
      // 1. MÓDULO: GESTÃO DE PROJETOS -> Sistema/Gestao_de_Projetos/
      // -----------------------------------------------------------------------
      const projFolder = 'Sistema/Gestao_de_Projetos';

      // 1.1 Projetos
      const projetosPayload = {
        modulo: 'Gestao_de_Projetos',
        entidade: 'Projetos',
        updatedAt: timestamp,
        updatedBy: currentUser,
        count: (fullData.projects || []).length,
        data: fullData.projects || []
      };
      const pRes = await this.uploadJsonWithRetry(token, ids.driveId, projFolder, 'projetos.json', projetosPayload);
      if (!pRes.success) errors.push(`Projetos JSON: ${pRes.error}`);

      // 1.2 Tarefas
      const tarefasPayload = {
        modulo: 'Gestao_de_Projetos',
        entidade: 'Tarefas',
        updatedAt: timestamp,
        updatedBy: currentUser,
        count: (fullData.tasks || []).length,
        data: fullData.tasks || []
      };
      const tRes = await this.uploadJsonWithRetry(token, ids.driveId, projFolder, 'tarefas.json', tarefasPayload);
      if (!tRes.success) errors.push(`Tarefas JSON: ${tRes.error}`);

      // 1.3 Equipe e Usuários
      const equipePayload = {
        modulo: 'Gestao_de_Projetos',
        entidade: 'Equipe_e_Usuarios',
        updatedAt: timestamp,
        updatedBy: currentUser,
        teamMembers: fullData.teamMembers || [],
        appUsers: fullData.appUsers || [],
        managerEmail: fullData.managerEmail || ''
      };
      const eRes = await this.uploadJsonWithRetry(token, ids.driveId, projFolder, 'equipe_e_usuarios.json', equipePayload);
      if (!eRes.success) errors.push(`Equipe JSON: ${eRes.error}`);

      // 1.4 Planos de Atividades
      const planosPayload = {
        modulo: 'Gestao_de_Projetos',
        entidade: 'Planos_de_Atividades',
        updatedAt: timestamp,
        updatedBy: currentUser,
        activityPlans: fullData.activityPlans || []
      };
      const plRes = await this.uploadJsonWithRetry(token, ids.driveId, projFolder, 'planos_de_atividades.json', planosPayload);
      if (!plRes.success) errors.push(`Planos de Atividades JSON: ${plRes.error}`);

      // 1.5 Histórico e Logs
      const logsPayload = {
        modulo: 'Gestao_de_Projetos',
        entidade: 'Historico_e_Logs',
        updatedAt: timestamp,
        updatedBy: currentUser,
        logs: fullData.logs || [],
        notifications: fullData.notifications || []
      };
      const lRes = await this.uploadJsonWithRetry(token, ids.driveId, projFolder, 'historico_logs.json', logsPayload);
      if (!lRes.success) errors.push(`Logs JSON: ${lRes.error}`);

      // 1.6 Snapshot Completo do Módulo de Gestão de Projetos
      const gestaoCompletaPayload = {
        modulo: 'Gestao_de_Projetos',
        schemaVersion: '1.0',
        updatedAt: timestamp,
        updatedBy: currentUser,
        projects: fullData.projects || [],
        tasks: fullData.tasks || [],
        teamMembers: fullData.teamMembers || [],
        activityPlans: fullData.activityPlans || [],
        appUsers: fullData.appUsers || [],
        managerEmail: fullData.managerEmail || '',
        logs: fullData.logs || [],
        notifications: fullData.notifications || []
      };
      const gcRes = await this.uploadJsonWithRetry(token, ids.driveId, projFolder, 'gestao_de_projetos_completo.json', gestaoCompletaPayload);
      if (!gcRes.success) errors.push(`Gestão de Projetos Completo JSON: ${gcRes.error}`);

      // 1.7 Perfis Individuais
      const teamMembers: any[] = fullData.teamMembers || [];
      const allTasks: any[] = fullData.tasks || [];
      const assignedTaskIds = new Set<string>();

      for (const member of teamMembers) {
        if (!member || !member.name) continue;
        const cleanName = member.name.trim();
        const safeFolderName = cleanName.replace(/[/\\?%*:|"<>]/g, '_');
        const memberTasks = allTasks.filter(t => {
          const isLead = t.projectLead?.trim().toLowerCase() === cleanName.toLowerCase();
          const isCollab = t.collaborators?.some((c: string) => c.trim().toLowerCase() === cleanName.toLowerCase());
          const isReviewer = t.currentReviewer?.trim().toLowerCase() === cleanName.toLowerCase();
          return isLead || isCollab || isReviewer;
        });
        memberTasks.forEach(t => assignedTaskIds.add(t.id));

        const profileData = {
          profileName: cleanName,
          lastUpdated: timestamp,
          updatedBy: currentUser,
          memberConfig: member,
          tasksCount: memberTasks.length,
          tasks: memberTasks
        };
        await this.uploadJsonWithRetry(
          token,
          ids.driveId,
          `Sistema/Gestao_de_Projetos/perfis/${safeFolderName}`,
          `perfil_${safeFolderName}.json`,
          profileData
        );
      }

      // -----------------------------------------------------------------------
      // 2. MÓDULO: NORMAS REGULATÓRIAS -> Sistema/Normas_Regulatorias/
      // -----------------------------------------------------------------------
      const regFolder = 'Sistema/Normas_Regulatorias';

      // 2.1 Normas e Assuntos Regulatórios
      const normasPayload = {
        modulo: 'Normas_Regulatorias',
        entidade: 'Normas_e_Assuntos',
        updatedAt: timestamp,
        updatedBy: currentUser,
        regulatoryStandards: fullData.regulatoryStandards || [],
        regulatorySubjects: fullData.regulatorySubjects || []
      };
      const nRes = await this.uploadJsonWithRetry(token, ids.driveId, regFolder, 'normas_e_assuntos.json', normasPayload);
      if (!nRes.success) errors.push(`Normas e Assuntos JSON: ${nRes.error}`);

      // 2.2 Dossiê e Evidências Regulatórias
      const dossiePayload = {
        modulo: 'Normas_Regulatorias',
        entidade: 'Dossie_e_Evidencias',
        updatedAt: timestamp,
        updatedBy: currentUser,
        regulatoryEvidence: fullData.regulatoryEvidence || [],
        regulatoryDocs: fullData.regulatoryDocs || [],
        dossierContributions: fullData.dossierContributions || []
      };
      const dRes = await this.uploadJsonWithRetry(token, ids.driveId, regFolder, 'dossie_e_evidencias.json', dossiePayload);
      if (!dRes.success) errors.push(`Dossiê e Evidências JSON: ${dRes.error}`);

      // 2.3 Narrativas e Configurações
      const narrativasPayload = {
        modulo: 'Normas_Regulatorias',
        entidade: 'Narrativas_e_Configuracoes',
        updatedAt: timestamp,
        updatedBy: currentUser,
        regulatoryNarratives: fullData.regulatoryNarratives || [],
        regulatoryInfoItems: fullData.regulatoryInfoItems || [],
        repeatableRecords: fullData.repeatableRecords || [],
        macroActivityConfigs: fullData.macroActivityConfigs || []
      };
      const nrRes = await this.uploadJsonWithRetry(token, ids.driveId, regFolder, 'narrativas_e_configuracoes.json', narrativasPayload);
      if (!nrRes.success) errors.push(`Narrativas e Configurações JSON: ${nrRes.error}`);

      // 2.4 Reuniões e Atas
      const reunioesPayload = {
        modulo: 'Normas_Regulatorias',
        entidade: 'Reunioes_e_Atas',
        updatedAt: timestamp,
        updatedBy: currentUser,
        meetings: fullData.meetings || []
      };
      await this.uploadJsonWithRetry(token, ids.driveId, regFolder, 'reunioes_e_atas.json', reunioesPayload);

      // 2.5 Snapshot Completo do Módulo de Normas Regulatórias
      const regCompletoPayload = {
        modulo: 'Normas_Regulatorias',
        schemaVersion: '1.0',
        updatedAt: timestamp,
        updatedBy: currentUser,
        regulatoryStandards: fullData.regulatoryStandards || [],
        regulatorySubjects: fullData.regulatorySubjects || [],
        regulatoryEvidence: fullData.regulatoryEvidence || [],
        regulatoryDocs: fullData.regulatoryDocs || [],
        dossierContributions: fullData.dossierContributions || [],
        regulatoryNarratives: fullData.regulatoryNarratives || [],
        regulatoryInfoItems: fullData.regulatoryInfoItems || [],
        repeatableRecords: fullData.repeatableRecords || [],
        macroActivityConfigs: fullData.macroActivityConfigs || [],
        meetings: fullData.meetings || []
      };
      const rcRes = await this.uploadJsonWithRetry(token, ids.driveId, regFolder, 'normas_regulatorias_completo.json', regCompletoPayload);
      if (!rcRes.success) errors.push(`Normas Regulatórias Completo JSON: ${rcRes.error}`);

      // -----------------------------------------------------------------------
      // 3. MÓDULO: VACINAS E COMPONENTES -> Sistema/Vacinas_e_Componentes/
      // -----------------------------------------------------------------------
      const vacFolder = 'Sistema/Vacinas_e_Componentes';

      // 3.1 Candidatos Vacinais
      const candidatosPayload = {
        modulo: 'Vacinas_e_Componentes',
        entidade: 'Candidatos_Vacinais',
        updatedAt: timestamp,
        updatedBy: currentUser,
        vaccineCandidates: fullData.vaccineCandidates || []
      };
      const cvRes = await this.uploadJsonWithRetry(token, ids.driveId, vacFolder, 'candidatos_vacinais.json', candidatosPayload);
      if (!cvRes.success) errors.push(`Candidatos Vacinais JSON: ${cvRes.error}`);

      // 3.2 Componentes, Lotes e Impurezas
      const componentesPayload = {
        modulo: 'Vacinas_e_Componentes',
        entidade: 'Componentes_e_Lotes',
        updatedAt: timestamp,
        updatedBy: currentUser,
        vaccineComponents: fullData.vaccineComponents || [],
        formulationBatches: fullData.formulationBatches || [],
        vaccineImpurities: fullData.vaccineImpurities || []
      };
      const clRes = await this.uploadJsonWithRetry(token, ids.driveId, vacFolder, 'componentes_e_lotes.json', componentesPayload);
      if (!clRes.success) errors.push(`Componentes e Lotes JSON: ${clRes.error}`);

      // 3.3 Snapshot Completo do Módulo de Vacinas e Componentes
      const vacinasCompletoPayload = {
        modulo: 'Vacinas_e_Componentes',
        schemaVersion: '1.0',
        updatedAt: timestamp,
        updatedBy: currentUser,
        vaccineCandidates: fullData.vaccineCandidates || [],
        vaccineComponents: fullData.vaccineComponents || [],
        formulationBatches: fullData.formulationBatches || [],
        vaccineImpurities: fullData.vaccineImpurities || []
      };
      const vcRes = await this.uploadJsonWithRetry(token, ids.driveId, vacFolder, 'vacinas_e_componentes_completo.json', vacinasCompletoPayload);
      if (!vcRes.success) errors.push(`Vacinas e Componentes Completo JSON: ${vcRes.error}`);

      // -----------------------------------------------------------------------
      // 4. MÓDULO: OBSOLETOS E ARQUIVADOS -> Sistema/Z-_Obsoletos/
      // -----------------------------------------------------------------------
      const obsFolder = 'Sistema/Z-_Obsoletos';
      const itensArquivadosPayload = {
        modulo: 'Z-_Obsoletos',
        entidade: 'Itens_Arquivados',
        updatedAt: timestamp,
        updatedBy: currentUser,
        membrosInativos: (fullData.teamMembers || []).filter((m: any) => m.active === false || m.discontinued === true),
        projetosConcluidosOuCancelados: (fullData.projects || []).filter((p: any) => p.phase === 'Concluído' || p.phase === 'Cancelado')
      };
      await this.uploadJsonWithRetry(token, ids.driveId, obsFolder, 'itens_arquivados.json', itensArquivadosPayload);

      // -----------------------------------------------------------------------
      // 5. ÍNDICE GERAL E BACKUP CONSOLIDADO -> Sistema/
      // -----------------------------------------------------------------------
      // 5.1 Índice Geral dos Módulos
      const indiceModulosPayload = {
        sistema: 'CT-Vacinas Sistema Integrado',
        updatedAt: timestamp,
        updatedBy: currentUser,
        sharePointSite: `${SHAREPOINT_HOST}${SITE_PATH}`,
        basePath: 'Documentos > Sistema',
        modulos: [
          {
            nome: 'Gestão de Projetos',
            pasta: 'Sistema/Gestao_de_Projetos',
            arquivos: ['projetos.json', 'tarefas.json', 'equipe_e_usuarios.json', 'planos_de_atividades.json', 'historico_logs.json', 'gestao_de_projetos_completo.json'],
            metricas: { projetos: (fullData.projects || []).length, tarefas: (fullData.tasks || []).length, membros: (fullData.teamMembers || []).length }
          },
          {
            nome: 'Normas Regulatórias',
            pasta: 'Sistema/Normas_Regulatorias',
            arquivos: ['normas_e_assuntos.json', 'dossie_e_evidencias.json', 'narrativas_e_configuracoes.json', 'reunioes_e_atas.json', 'normas_regulatorias_completo.json'],
            metricas: { normas: (fullData.regulatoryStandards || []).length, evidencias: (fullData.regulatoryEvidence || []).length, atas: (fullData.meetings || []).length }
          },
          {
            nome: 'Vacinas e Componentes',
            pasta: 'Sistema/Vacinas_e_Componentes',
            arquivos: ['candidatos_vacinais.json', 'componentes_e_lotes.json', 'vacinas_e_componentes_completo.json'],
            metricas: { candidatos: (fullData.vaccineCandidates || []).length, componentes: (fullData.vaccineComponents || []).length, lotes: (fullData.formulationBatches || []).length }
          },
          {
            nome: 'Obsoletos e Arquivados',
            pasta: 'Sistema/Z-_Obsoletos',
            arquivos: ['itens_arquivados.json']
          },
          {
            nome: 'Histórico de Edições',
            pasta: 'Sistema/Historico_Edicoes',
            arquivos: ['Snapshots de cada edição com timestamp']
          },
          {
            nome: 'Backups Diários (00:00)',
            pasta: 'Sistema/Backups_Diarios',
            arquivos: ['backup_YYYY-MM-DD.json']
          }
        ]
      };
      await this.uploadJsonWithRetry(token, ids.driveId, 'Sistema', 'indice_modulos.json', indiceModulosPayload);

      // 5.2 Arquivo de Revisão Individual da Edição -> Sistema/Historico_Edicoes/
      const safeTime = timestamp.replace(/[:.]/g, '-');
      const safeUser = (currentUser || 'usuario').replace(/[/\\?%*:|"<>]/g, '_');
      const editionPayload = {
        edicaoId: `edit_${safeTime}_${safeUser}`,
        timestamp,
        usuario: currentUser,
        sumario: {
          totalProjetos: (fullData.projects || []).length,
          totalTarefas: (fullData.tasks || []).length,
          totalNormas: (fullData.regulatoryStandards || []).length,
          totalVacinas: (fullData.vaccineCandidates || []).length
        },
        dados: fullData
      };
      await this.uploadJsonWithRetry(
        token,
        ids.driveId,
        'Sistema/Historico_Edicoes',
        `edicao_${safeTime}_${safeUser}.json`,
        editionPayload
      );

      // 5.3 db.json e espelhos diretos na raiz da pasta Sistema (para visualização imediata)
      const fullCloudData = {
        ...fullData,
        lastBackupAt: timestamp,
        lastBackupBy: currentUser,
        version: '2.0-modular'
      };
      await this.uploadJsonWithRetry(token, ids.driveId, 'Sistema', 'db.json', fullCloudData);
      await this.uploadJsonWithRetry(token, ids.driveId, 'Sistema', 'tarefas.json', fullData.tasks || []);
      await this.uploadJsonWithRetry(token, ids.driveId, 'Sistema', 'projetos.json', fullData.projects || []);

      return {
        success: errors.length === 0,
        updatedETags,
        errors
      };
    } catch (e: any) {
      console.error('Erro ao salvar estrutura modular no SharePoint:', e);
      return { success: false, updatedETags: {}, errors: [e.message] };
    }
  },

  // Salva o snapshot diário completo agendado para as 00:00 (ou acionado no início do dia)
  async saveDailyBackupToSharePoint(fullData: any): Promise<{ success: boolean; dateStr: string; error?: string }> {
    const token = await this.getToken();
    if (!token) return { success: false, dateStr: '', error: 'Não autenticado no Microsoft 365' };

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return { success: false, dateStr: '', error: 'Site ou Drive não encontrados' };

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timestamp = now.toISOString();
      const backupFolder = 'Sistema/Backups_Diarios';

      const dailyBackupData = {
        dataBackup: dateStr,
        horario: timestamp,
        tipo: 'Backup Diário Automático (00:00)',
        versao: '2.0',
        estatisticas: {
          projetos: (fullData.projects || []).length,
          tarefas: (fullData.tasks || []).length,
          membros: (fullData.teamMembers || []).length,
          normas: (fullData.regulatoryStandards || []).length,
          candidatosVacinas: (fullData.vaccineCandidates || []).length,
          reunioes: (fullData.meetings || []).length
        },
        data: fullData
      };

      // 1. Snapshot diário consolidado
      await this.uploadJsonWithRetry(token, ids.driveId, backupFolder, `backup_${dateStr}.json`, dailyBackupData);
      
      // 2. Snapshot diário modular de Projetos
      await this.uploadJsonWithRetry(token, ids.driveId, backupFolder, `gestao_projetos_${dateStr}.json`, {
        dataBackup: dateStr,
        horario: timestamp,
        projects: fullData.projects || [],
        tasks: fullData.tasks || [],
        teamMembers: fullData.teamMembers || [],
        activityPlans: fullData.activityPlans || []
      });

      // 3. Snapshot diário modular de Normas Regulatórias
      await this.uploadJsonWithRetry(token, ids.driveId, backupFolder, `normas_regulatorias_${dateStr}.json`, {
        dataBackup: dateStr,
        horario: timestamp,
        regulatoryStandards: fullData.regulatoryStandards || [],
        regulatorySubjects: fullData.regulatorySubjects || [],
        regulatoryEvidence: fullData.regulatoryEvidence || [],
        regulatoryDocs: fullData.regulatoryDocs || [],
        meetings: fullData.meetings || []
      });

      // 4. Snapshot diário modular de Vacinas
      await this.uploadJsonWithRetry(token, ids.driveId, backupFolder, `vacinas_componentes_${dateStr}.json`, {
        dataBackup: dateStr,
        horario: timestamp,
        vaccineCandidates: fullData.vaccineCandidates || [],
        vaccineComponents: fullData.vaccineComponents || [],
        formulationBatches: fullData.formulationBatches || [],
        vaccineImpurities: fullData.vaccineImpurities || []
      });

      console.log(`[Backup Diário 00:00] Backup de ${dateStr} salvo com sucesso no SharePoint.`);
      return { success: true, dateStr };
    } catch (e: any) {
      console.error('Erro ao salvar backup diário:', e);
      return { success: false, dateStr: '', error: e.message };
    }
  },

  // Carrega e reconstrói o estado a partir dos arquivos modulares ou do db.json
  async loadModularFromSharePoint(): Promise<{ data: any; version?: string } | null> {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return null;

      // 1. Tenta carregar primeiro o db.json consolidado da raiz de Sistema
      const masterDb = await this.downloadJsonFromSharePointPath(token, ids.driveId, 'Sistema', 'db.json');
      if (masterDb && masterDb.data) {
        return { data: masterDb.data, version: masterDb.eTag };
      }

      // 2. Se não existir db.json, reconstrói o estado lendo os arquivos modulares individuais
      console.log('db.json não encontrado. Reconstruindo dados a partir dos arquivos modulares...');
      const gestaoProj = await this.downloadJsonFromSharePointPath(token, ids.driveId, 'Sistema/Gestao_de_Projetos', 'gestao_de_projetos_completo.json');
      const normasReg = await this.downloadJsonFromSharePointPath(token, ids.driveId, 'Sistema/Normas_Regulatorias', 'normas_regulatorias_completo.json');
      const vacinasComp = await this.downloadJsonFromSharePointPath(token, ids.driveId, 'Sistema/Vacinas_e_Componentes', 'vacinas_e_componentes_completo.json');

      const reconstructed: any = {
        projects: gestaoProj?.data?.projects || [],
        tasks: gestaoProj?.data?.tasks || [],
        teamMembers: gestaoProj?.data?.teamMembers || [],
        activityPlans: gestaoProj?.data?.activityPlans || [],
        appUsers: gestaoProj?.data?.appUsers || [],
        managerEmail: gestaoProj?.data?.managerEmail || 'brunadias@ctvacinas.org',
        logs: gestaoProj?.data?.logs || [],
        notifications: gestaoProj?.data?.notifications || [],
        regulatoryStandards: normasReg?.data?.regulatoryStandards || [],
        regulatorySubjects: normasReg?.data?.regulatorySubjects || [],
        regulatoryEvidence: normasReg?.data?.regulatoryEvidence || [],
        regulatoryDocs: normasReg?.data?.regulatoryDocs || [],
        dossierContributions: normasReg?.data?.dossierContributions || [],
        regulatoryNarratives: normasReg?.data?.regulatoryNarratives || [],
        regulatoryInfoItems: normasReg?.data?.regulatoryInfoItems || [],
        repeatableRecords: normasReg?.data?.repeatableRecords || [],
        macroActivityConfigs: normasReg?.data?.macroActivityConfigs || [],
        meetings: normasReg?.data?.meetings || [],
        vaccineCandidates: vacinasComp?.data?.vaccineCandidates || [],
        vaccineComponents: vacinasComp?.data?.vaccineComponents || [],
        formulationBatches: vacinasComp?.data?.formulationBatches || [],
        vaccineImpurities: vacinasComp?.data?.vaccineImpurities || []
      };

      return { data: reconstructed, version: 'reconstructed' };
    } catch (e) {
      console.error('Erro ao carregar dados modulares do SharePoint:', e);
      return null;
    }
  },

  // Sincroniza todas as planilhas derivadas correspondentes aos módulos e perfis
  async syncAllModularExcelToSharePoint(data: any): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    const token = await this.getToken();
    if (!token) return { success: false, syncedCount: 0, errors: ['Não autenticado'] };

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return { success: false, syncedCount: 0, errors: ['Site ou Drive não encontrados'] };

      const errors: string[] = [];
      let syncedCount = 0;

      // 1. Excel do Módulo Normas Regulatórias
      try {
        const wbReg = generateRegulatoryWorkbook(
          { name: 'Geral', isLeader: true } as any,
          data.projects || [],
          data.tasks || [],
          data.regulatoryEvidence || [],
          data.regulatoryStandards || [],
          data.regulatoryDocs || [],
          data.dossierContributions || []
        );
        const resReg = await uploadExcelToSharePointPath(token, ids.driveId, 'sistema/Normas_Regulatorias', 'Normas_Regulatorias.xlsx', wbReg);
        if (resReg.success) syncedCount++;
        else errors.push(`Normas Regulatórias Excel: ${resReg.error}`);
      } catch (err: any) {
        errors.push(`Normas Regulatórias Excel: ${err.message}`);
      }

      // 2. Excel do Módulo Vacinas e Componentes
      try {
        const wbVac = generateVaccinesWorkbook(
          data.vaccineCandidates || [],
          data.vaccineComponents || [],
          data.formulationBatches || []
        );
        const resVac = await uploadExcelToSharePointPath(token, ids.driveId, 'sistema/Vacinas_e_Componentes', 'Vacinas_e_Componentes.xlsx', wbVac);
        if (resVac.success) syncedCount++;
        else errors.push(`Vacinas e Componentes Excel: ${resVac.error}`);
      } catch (err: any) {
        errors.push(`Vacinas e Componentes Excel: ${err.message}`);
      }

      // 3. Excel do Módulo Gestão de Projetos (Geral)
      try {
        const wbProj = generateProjectsWorkbook({ name: 'Geral', isLeader: true } as any, data.projects || []);
        const resProj = await uploadExcelToSharePointPath(token, ids.driveId, 'sistema/Gestao_de_Projetos', 'Projetos_e_Atividades.xlsx', wbProj);
        if (resProj.success) syncedCount++;
        else errors.push(`Gestão de Projetos Excel: ${resProj.error}`);
      } catch (err: any) {
        errors.push(`Gestão de Projetos Excel: ${err.message}`);
      }

      // 4. Excel de cada Perfil Individual
      const teamMembers: any[] = data.teamMembers || [];
      for (const member of teamMembers) {
        if (!member || !member.name) continue;
        const cleanName = member.name.trim();
        const safeFolderName = cleanName.replace(/[/\\?%*:|"<>]/g, '_');
        const folderPath = `sistema/Gestao_de_Projetos/perfis/${safeFolderName}`;

        try {
          const wbTasks = generateMonthlyTasksWorkbook(member, data.tasks || [], data.projects || []);
          const wbMemberProj = generateProjectsWorkbook(member, data.projects || []);

          const resT = await uploadExcelToSharePointPath(token, ids.driveId, folderPath, `Atividades_do_Mes_${safeFolderName}.xlsx`, wbTasks);
          const resP = await uploadExcelToSharePointPath(token, ids.driveId, folderPath, `Projetos_e_Atividades_${safeFolderName}.xlsx`, wbMemberProj);

          if (resT.success && resP.success) {
            syncedCount += 2;
          } else {
            if (!resT.success) errors.push(`[${member.name}] Atividades: ${resT.error}`);
            if (!resP.success) errors.push(`[${member.name}] Projetos: ${resP.error}`);
          }
        } catch (memErr: any) {
          errors.push(`[${member.name}] ${memErr.message}`);
        }
      }

      return {
        success: errors.length === 0,
        syncedCount,
        errors
      };
    } catch (e: any) {
      return { success: false, syncedCount: 0, errors: [e.message] };
    }
  },

  // =========================================================================
  // MÉTODOS CONTEXTUAIS DE DOWNLOAD E SINCRONIZAÇÃO (Requirement 3)
  // =========================================================================

  downloadContextualExcel(context: 'profile' | 'projects' | 'regulatory' | 'vaccines', data: any, profileName?: string) {
    if (context === 'profile' && profileName) {
      const member = (data.teamMembers || []).find((m: any) => m.name?.toLowerCase() === profileName.toLowerCase()) || { name: profileName, isLeader: true };
      const wb = generateMonthlyTasksWorkbook(member, data.tasks || [], data.projects || []);
      const safeName = profileName.replace(/[/\\?%*:|"<>]/g, '_');
      downloadWorkbookAsFile(wb, `Atividades_${safeName}.xlsx`);
    } else if (context === 'projects') {
      const member = (data.teamMembers || []).find((m: any) => m.name?.toLowerCase() === profileName?.toLowerCase()) || { name: 'Geral', isLeader: true };
      const wb = generateProjectsWorkbook(member, data.projects || []);
      downloadWorkbookAsFile(wb, 'Projetos_e_Atividades.xlsx');
    } else if (context === 'regulatory') {
      const wb = generateRegulatoryWorkbook(
        { name: 'Geral', isLeader: true } as any,
        data.projects || [],
        data.tasks || [],
        data.regulatoryEvidence || [],
        data.regulatoryStandards || [],
        data.regulatoryDocs || [],
        data.dossierContributions || []
      );
      downloadWorkbookAsFile(wb, 'Normas_Regulatorias.xlsx');
    } else if (context === 'vaccines') {
      const wb = generateVaccinesWorkbook(
        data.vaccineCandidates || [],
        data.vaccineComponents || [],
        data.formulationBatches || []
      );
      downloadWorkbookAsFile(wb, 'Vacinas_e_Componentes.xlsx');
    }
  },

  async syncContextualExcelToSharePoint(
    context: 'profile' | 'projects' | 'regulatory' | 'vaccines',
    data: any,
    profileName?: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const token = await this.getToken();
    if (!token) return { success: false, message: 'Usuário não autenticado no SharePoint.', error: 'Não autenticado' };

    try {
      const ids = await this.getSiteAndDriveId(token);
      if (!ids) return { success: false, message: 'Não foi possível conectar ao SharePoint.', error: 'Drive não encontrado' };

      if (context === 'profile' && profileName) {
        const member = (data.teamMembers || []).find((m: any) => m.name?.toLowerCase() === profileName.toLowerCase()) || { name: profileName, isLeader: true };
        const safeFolderName = profileName.replace(/[/\\?%*:|"<>]/g, '_');
        const folderPath = `sistema/Gestao_de_Projetos/perfis/${safeFolderName}`;

        const wbTasks = generateMonthlyTasksWorkbook(member, data.tasks || [], data.projects || []);
        const res = await uploadExcelToSharePointPath(token, ids.driveId, folderPath, `Atividades_do_Mes_${safeFolderName}.xlsx`, wbTasks);
        if (res.success) {
          return { success: true, message: `Planilha de atividades do perfil ${profileName} sincronizada no SharePoint com sucesso!` };
        } else {
          return { success: false, message: `Falha ao sincronizar planilha no SharePoint: ${res.error}`, error: res.error };
        }
      } else if (context === 'projects') {
        const wbProj = generateProjectsWorkbook({ name: 'Geral', isLeader: true } as any, data.projects || []);
        const res = await uploadExcelToSharePointPath(token, ids.driveId, 'sistema/Gestao_de_Projetos', 'Projetos_e_Atividades.xlsx', wbProj);
        if (res.success) {
          return { success: true, message: 'Planilha de Projetos e Atividades sincronizada no SharePoint com sucesso!' };
        } else {
          return { success: false, message: `Falha ao sincronizar planilha de projetos: ${res.error}`, error: res.error };
        }
      } else if (context === 'regulatory') {
        const wbReg = generateRegulatoryWorkbook(
          { name: 'Geral', isLeader: true } as any,
          data.projects || [],
          data.tasks || [],
          data.regulatoryEvidence || [],
          data.regulatoryStandards || [],
          data.regulatoryDocs || [],
          data.dossierContributions || []
        );
        const res = await uploadExcelToSharePointPath(token, ids.driveId, 'sistema/Normas_Regulatorias', 'Normas_Regulatorias.xlsx', wbReg);
        if (res.success) {
          return { success: true, message: 'Planilha de Normas Regulatórias sincronizada no SharePoint com sucesso!' };
        } else {
          return { success: false, message: `Falha ao sincronizar normas regulatórias: ${res.error}`, error: res.error };
        }
      } else if (context === 'vaccines') {
        const wbVac = generateVaccinesWorkbook(
          data.vaccineCandidates || [],
          data.vaccineComponents || [],
          data.formulationBatches || []
        );
        const res = await uploadExcelToSharePointPath(token, ids.driveId, 'sistema/Vacinas_e_Componentes', 'Vacinas_e_Componentes.xlsx', wbVac);
        if (res.success) {
          return { success: true, message: 'Planilha de Vacinas e Componentes sincronizada no SharePoint com sucesso!' };
        } else {
          return { success: false, message: `Falha ao sincronizar vacinas e componentes: ${res.error}`, error: res.error };
        }
      }

      return { success: true, message: 'Sincronização concluída com sucesso!' };
    } catch (e: any) {
      return { success: false, message: `Erro ao sincronizar com SharePoint: ${e.message}`, error: e.message };
    }
  }
};

