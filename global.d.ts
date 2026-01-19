
// Fix: Added export {} to treat this file as an external module, resolving TS2669 error for global augmentations
export {};

declare global {
  interface Window {
    msal: any;
  }
}

declare module '@azure/msal-browser' {
  export const PublicClientApplication: any;
  export const LogLevel: any;
  export type Configuration = any;
}
