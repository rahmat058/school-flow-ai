/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API prefix; defaults to `/api/v1`. See `src/lib/env.ts`. */
  readonly VITE_API_URL?: string
  /** `'false'` disables the mock adapter so requests hit a real backend. */
  readonly VITE_ENABLE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
