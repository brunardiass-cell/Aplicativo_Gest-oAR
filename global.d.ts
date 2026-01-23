export {};

declare global {
  interface Window {
    msal: any;
  }
  
  // FIX: To resolve the "Cannot redeclare block-scoped variable 'process'" error,
  // we augment the existing NodeJS.ProcessEnv interface instead of declaring a new
  // 'process' variable. This is the standard way to add types for environment variables
  // in a project that includes Node.js type definitions.
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}
