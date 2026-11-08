/// <reference types="vite/client" />

declare module '*.mjs' {
  const handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => Promise<void> | void;
  export default handler;
}
