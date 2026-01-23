
export {};

declare global {
  interface Window {
    msal: any;
  }
}

// FIX: Removed __API_KEY__ declaration. Per @google/genai guidelines, the API key must be
// accessed via process.env.API_KEY. This declaration provides the necessary types for
// TypeScript to compile without errors. Vite handles the value replacement at build time.
declare var process: {
  env: {
    API_KEY: string;
  };
};
