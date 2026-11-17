import type { NeeoApi } from './api';
import { runtimeConfig } from '@/config';

/** Resolved by src/config (fails closed: preview/production are always 'supabase'). */
export const DATA_MODE = runtimeConfig.dataMode;

function createApi(): NeeoApi {
  if (DATA_MODE === 'supabase') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseApi } = require('./supabase') as typeof import('./supabase');
    return createSupabaseApi();
  }
  if (!runtimeConfig.allowMocks) throw new Error('Mock backend is development-only'); // unreachable: resolveRuntimeConfig already throws
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMockApi } = require('./mock') as typeof import('./mock');
  return createMockApi();
}

export const api: NeeoApi = createApi();
export * from './types';
export type { NeeoApi } from './api';
