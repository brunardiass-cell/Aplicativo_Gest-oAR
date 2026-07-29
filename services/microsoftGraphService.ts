
import * as msal from "@azure/msal-browser";

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
  }
};

