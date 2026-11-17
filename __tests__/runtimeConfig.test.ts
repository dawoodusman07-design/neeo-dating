import { ConfigError, resolveRuntimeConfig } from '@/config/resolve';

const SUPABASE = { supabaseUrl: 'https://abc.supabase.co', supabaseAnonKey: 'anon-key' };
const FULL = { dataMode: 'supabase', revenueCatKey: 'appl_key', ...SUPABASE };

describe('runtime config fails closed outside development', () => {
  it.each(['production', 'preview'])('%s without EXPO_PUBLIC_DATA_MODE=supabase throws', (appVariant) => {
    for (const dataMode of [undefined, '', 'mock', 'Supabase ']) {
      expect(() => resolveRuntimeConfig({ ...FULL, appVariant, dataMode })).toThrow(ConfigError);
    }
  });

  it.each(['production', 'preview'])('%s without the Supabase URL or key throws, naming what is missing', (appVariant) => {
    expect(() => resolveRuntimeConfig({ ...FULL, appVariant, supabaseUrl: undefined })).toThrow(/EXPO_PUBLIC_SUPABASE_URL is missing/);
    expect(() => resolveRuntimeConfig({ ...FULL, appVariant, supabaseAnonKey: '  ' })).toThrow(/EXPO_PUBLIC_SUPABASE_ANON_KEY is missing/);
    expect(() => resolveRuntimeConfig({ ...FULL, appVariant, supabaseUrl: 'http://abc.supabase.co' })).toThrow(/https/);
  });

  it.each(['production', 'preview'])('%s without a RevenueCat key throws (mock store is dev-only)', (appVariant) => {
    expect(() => resolveRuntimeConfig({ ...FULL, appVariant, revenueCatKey: undefined })).toThrow(/RevenueCat/);
  });

  it('lists every problem at once', () => {
    try {
      resolveRuntimeConfig({ appVariant: 'production' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigError);
      expect((e as ConfigError).problems).toHaveLength(4);
    }
  });

  it('an unknown APP_VARIANT is treated as the strictest case and rejected', () => {
    expect(() => resolveRuntimeConfig({ ...FULL, appVariant: 'staging' })).toThrow(/APP_VARIANT is "staging"/);
  });

  it.each(['production', 'preview'])('%s with everything set resolves to Supabase with mocks disabled', (appVariant) => {
    expect(resolveRuntimeConfig({ ...FULL, appVariant })).toEqual({
      appVariant, dataMode: 'supabase', revenueCatKey: 'appl_key', supabaseUrl: 'https://abc.supabase.co', supabaseAnonKey: 'anon-key', allowMocks: false,
    });
  });

  it('development defaults to mock data and allows mocks', () => {
    expect(resolveRuntimeConfig({})).toMatchObject({ appVariant: 'development', dataMode: 'mock', allowMocks: true });
  });

  it('development with Supabase still requires the URL and key', () => {
    expect(() => resolveRuntimeConfig({ dataMode: 'supabase' })).toThrow(/EXPO_PUBLIC_SUPABASE_URL is missing/);
    expect(resolveRuntimeConfig({ dataMode: 'supabase', ...SUPABASE })).toMatchObject({ dataMode: 'supabase', allowMocks: true });
  });
});

describe('startup module', () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL };
    jest.resetModules();
  });

  it('throws at import when a production build is configured for mock data', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: { appVariant: 'production' } } } }));
    process.env.EXPO_PUBLIC_DATA_MODE = 'mock';
    expect(() => require('@/config')).toThrow(/must be "supabase" in production builds/);
  });

  it('loads in development and enables mocks', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: { appVariant: 'development' } } } }));
    delete process.env.EXPO_PUBLIC_DATA_MODE;
    expect(require('@/config').runtimeConfig).toMatchObject({ dataMode: 'mock', allowMocks: true });
  });
});
