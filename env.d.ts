/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional SWAPI base URL override, e.g. a mirror. Defaults to https://swapi.dev/api */
  readonly VITE_SWAPI_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
