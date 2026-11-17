export type AppVariant = 'development' | 'preview' | 'production';
export type DataMode = 'mock' | 'supabase';

export type RawEnv = {
  appVariant?: string;
  dataMode?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  /** RevenueCat public SDK key for the platform being built. */
  revenueCatKey?: string;
};

export type RuntimeConfig = {
  appVariant: AppVariant;
  dataMode: DataMode;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  revenueCatKey?: string;
  /** True only in development builds. Gates every mock (backend, store, developer menu). */
  allowMocks: boolean;
};

export declare class ConfigError extends Error {
  problems: string[];
  constructor(problems: string[]);
}

/** Throws ConfigError listing every problem; never falls back to mock outside development. */
export declare function resolveRuntimeConfig(env: RawEnv): RuntimeConfig;
