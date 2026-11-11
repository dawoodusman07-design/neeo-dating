import type { NeeoApi } from './api';
import { createMockApi } from './mock';

export const DATA_MODE = (process.env.EXPO_PUBLIC_DATA_MODE ?? 'mock') as 'mock' | 'supabase';

function createApi(): NeeoApi {
  if (DATA_MODE === 'supabase') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseApi } = require('./supabase') as typeof import('./supabase');
    return createSupabaseApi();
  }
  return createMockApi();
}

export const api: NeeoApi = createApi();
export * from './types';
export type { NeeoApi } from './api';
