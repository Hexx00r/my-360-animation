/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute origin of the API Worker. Empty = same origin (/api/*). */
  readonly VITE_API_BASE?: string
}
