# Gestão de Atividades - Assuntos Regulatórios

Uma plataforma robusta para gestão de projetos e tarefas do setor de Assuntos Regulatórios, construída com React, TypeScript e Vite.

## Funcionalidades Principais

-   **Dashboard Executivo:** KPIs, gráficos e alertas para uma visão geral da performance do setor.
-   **Gestão de Atividades:** Crie, atribua e acompanhe o progresso de tarefas regulatórias.
-   **Fluxos de Projeto:** Defina projetos com macro e microatividades, e acompanhe o cronograma.
-   **Controle de Acesso:** Gerencie quem pode acessar o sistema e quais são suas permissões.
-   **Sincronização em Nuvem:** Os dados são salvos e sincronizados com o SharePoint via Microsoft Graph API.
-   **Backup e Restauração:** Ferramentas administrativas para exportar e importar todos os dados do sistema.

## Setup

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure as Variáveis de Ambiente:**
    Este projeto requer uma chave de API do Google GenAI. Crie um arquivo `.env.local` na raiz do projeto e adicione sua chave:
    ```
    API_KEY=SUA_CHAVE_DE_API_AQUI
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

## Autenticação

A aplicação utiliza o Microsoft Azure Active Directory para autenticação. Um registro de aplicativo precisa ser configurado no portal Azure com as permissões corretas (`User.Read`, `Files.ReadWrite.All`, `Sites.Read.All`) e o `CLIENT_ID` resultante deve ser inserido no arquivo `services/microsoftGraphService.ts`. O `Redirect URI` deve ser configurado para a URL onde a aplicação está hospedada.
