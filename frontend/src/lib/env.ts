/**
 * The only place `import.meta.env` is read. Components and services import these values instead of
 * touching the env object directly, so the surface is typed and greppable.
 *
 * Note the defensive read: when the bundle runs outside Vite (e.g. the Node integration test)
 * `import.meta.env` does not exist, so defaults apply rather than throwing.
 */

interface ImportMetaEnvLike {
  VITE_API_URL?: string
  VITE_ENABLE_MOCKS?: string
  DEV?: boolean
}

const metaEnv: ImportMetaEnvLike = (import.meta as unknown as { env?: ImportMetaEnvLike }).env ?? {}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

export const env = {
  /** Global API prefix from `docs/backend/Design.md`; overridable for a deployed backend. */
  apiUrl: (metaEnv.VITE_API_URL?.trim() || '/api/v1').replace(/\/+$/, ''),
  /** Mocks are on unless explicitly disabled, so the demo runs with no backend. */
  enableMocks: readBoolean(metaEnv.VITE_ENABLE_MOCKS, true),
  isDev: metaEnv.DEV ?? false,
} as const
