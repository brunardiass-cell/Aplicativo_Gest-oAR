
# Gestão de Atividades - Assuntos Regulatórios

Uma plataforma robusta para gestão de projetos e tarefas do setor de Assuntos Regulatórios, construída com React, TypeScript e Vite.

## Funcionalidades Principais

-   **Dashboard Executivo:** KPIs, gráficos e alertas para uma visão geral da performance do setor.
-   **Gestão de Atividades:** Crie, atribua e acompanhe o progresso de tarefas regulatórias.
-   **Fluxos de Projeto:** Defina projetos com macro e microatividades, e acompanhe o cronograma.
-   **Controle de Acesso:** Gerencie quem pode acessar o sistema e quais são suas permissões.
-   **Sincronização com SharePoint:** Os dados são salvos e sincronizados em tempo real com um arquivo `database.json` no SharePoint via Microsoft Graph API.
-   **Autenticação Segura:** Login integrado com o Microsoft Azure Active Directory para garantir acesso seguro.

## Setup

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure a Autenticação (Obrigatório):**
    A aplicação utiliza o Microsoft Azure Active Directory para autenticação e acesso ao SharePoint.
    
    - **Registro de Aplicativo no Azure:**
        1. Acesse o portal do **Azure Active Directory**.
        2. Vá para **Registros de aplicativo** e crie um novo registro.
        3. Em **Tipos de conta suportados**, selecione a opção que se aplica à sua organização.
        4. Na seção **Redirecionar URI**, selecione **Aplicativo de página única (SPA)** e insira a URL onde a aplicação será hospedada (para desenvolvimento local, use `http://localhost:5173`).
        5. Após o registro, copie o **ID do cliente (aplicativo)**.

    - **Atualize o Código:**
        Abra o arquivo `src/services/microsoftGraphService.ts` e cole o seu `CLIENT_ID` na constante `clientId`.
        ```typescript
        // src/services/microsoftGraphService.ts
        const msalConfig = {
          auth: {
            clientId: 'COLE_SEU_ID_DO_CLIENTE_AQUI', // <--- ATUALIZE AQUI
            // ...
          },
        };
        ```

    - **Permissões da API:**
        No seu registro de aplicativo no Azure, vá para **Permissões de API**. Adicione as seguintes permissões delegadas do **Microsoft Graph**:
        - `User.Read`
        - `Files.ReadWrite.All`
        - `Sites.Read.All`
        Clique em **Conceder consentimento de administrador** para as permissões adicionadas.

3.  **Configure a Chave da API Gemini (Opcional):**
    Para usar a funcionalidade de geração de relatórios com IA, crie um arquivo `.env.local` na raiz e adicione sua chave:
    ```
    API_KEY=SUA_CHAVE_DE_API_GEMINI_AQUI
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
