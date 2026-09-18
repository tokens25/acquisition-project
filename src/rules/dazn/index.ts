/*
 * Relative imports here and in build.ts carry the `.js` extension on purpose.
 * Vercel compiles these files to ES modules one by one, and Node's ES-module
 * loader resolves neither a folder nor an extensionless path — the deployed
 * /api/dazn died on exactly that. TypeScript, Vite and esbuild all map
 * `./spec.js` back to `spec.ts`, so nothing changes locally.
 */
export * from './spec.js'
export * from './build.js'
