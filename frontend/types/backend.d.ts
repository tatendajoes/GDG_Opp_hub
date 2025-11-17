// Type declarations for backend services
// These modules are externalized in webpack and loaded at runtime
declare module 'playwright' {
  export const chromium: any
  export type Browser = any
  export type Page = any
  export type BrowserContext = any
}

declare module 'playwright-core' {
  export const chromium: any
  export type Browser = any
  export type Page = any
  export type BrowserContext = any
}

declare module 'puppeteer' {
  export const launch: any
  export type Browser = any
  export type Page = any
  export type BrowserContext = any
}

