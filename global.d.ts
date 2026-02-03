
export {};

declare global {
  interface Window {
    msal: any;
  }
  
  // FIX: Declara explicitamente a variável 'process' no escopo global para o TypeScript.
  // Isso resolve o erro "Cannot find name 'process'" em ambientes de navegador
  // onde 'process' não existe nativamente, mas é injetado pelo Vite.
  // FIX: Switched from redeclaring 'process' to augmenting the NodeJS namespace
  // to avoid a redeclaration error with existing global types.
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}