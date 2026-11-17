/**
 * Runtime configuration, resolved at startup (src/config/index.ts) AND at build time
 * (app.config.ts). FAILS CLOSED: preview and production builds must use Supabase and the
 * real store. The in-memory mock backend and mock store are development-only.
 *
 * Plain CommonJS so Expo's config loader can require it; types in resolve.d.ts.
 */
const VARIANTS = ['development', 'preview', 'production'];
const MODES = ['mock', 'supabase'];
const blank = (v) => !v || !String(v).trim();

class ConfigError extends Error {
  constructor(problems) {
    super(
      `Neeo cannot start: invalid configuration for this build.\n- ${problems.join('\n- ')}\n` +
        'Preview and production builds never fall back to mock data. Set the missing values in eas.json / EAS environment variables (see .env.example).',
    );
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

function resolveRuntimeConfig(env) {
  const problems = [];

  const variantRaw = (env.appVariant && env.appVariant.trim()) || 'development';
  const knownVariant = VARIANTS.includes(variantRaw);
  if (!knownVariant) problems.push(`APP_VARIANT is "${variantRaw}"; expected one of ${VARIANTS.join(', ')}.`);
  const appVariant = knownVariant ? variantRaw : 'production'; // unknown → strictest
  const strict = appVariant !== 'development';

  const modeRaw = (env.dataMode && env.dataMode.trim()) || (strict ? '' : 'mock');
  if (strict && modeRaw !== 'supabase') {
    problems.push(`EXPO_PUBLIC_DATA_MODE must be "supabase" in ${appVariant} builds (got ${modeRaw ? `"${modeRaw}"` : 'nothing'}).`);
  } else if (!MODES.includes(modeRaw)) {
    problems.push(`EXPO_PUBLIC_DATA_MODE is "${modeRaw}"; expected "mock" or "supabase".`);
  }
  const dataMode = strict ? 'supabase' : MODES.includes(modeRaw) ? modeRaw : 'mock';

  if (dataMode === 'supabase') {
    if (blank(env.supabaseUrl)) problems.push('EXPO_PUBLIC_SUPABASE_URL is missing.');
    else if (!/^https:\/\/\S+$/.test(env.supabaseUrl.trim())) problems.push('EXPO_PUBLIC_SUPABASE_URL must be an https:// URL.');
    if (blank(env.supabaseAnonKey)) problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is missing.');
  }
  if (strict && blank(env.revenueCatKey)) {
    problems.push('The RevenueCat key for this platform (EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY) is missing; the mock store is development-only.');
  }

  if (problems.length) throw new ConfigError(problems);
  const trim = (v) => (blank(v) ? undefined : String(v).trim());
  return {
    appVariant,
    dataMode,
    supabaseUrl: trim(env.supabaseUrl),
    supabaseAnonKey: trim(env.supabaseAnonKey),
    revenueCatKey: trim(env.revenueCatKey),
    allowMocks: !strict,
  };
}

module.exports = { resolveRuntimeConfig, ConfigError };
