// src/types/global.d.ts
export {}

declare global {
interface Window {
turnstile?: {
render: (el: string | HTMLElement, opts: Record<string, any>) => string
reset: (id?: string) => void
}
LogRocket?: {
captureException: (error: Error, options?: { extra?: Record<string, any> }) => void;
init: (appId: string, options?: any) => void;
}
}

interface ImportMetaEnv {
DEV: any
readonly VITE_API_BASE?: string
readonly VITE_TURNSTILE_SITE_KEY?: string
}
interface ImportMeta {
readonly env: ImportMetaEnv
}

}
