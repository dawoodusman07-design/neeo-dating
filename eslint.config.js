// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'supabase/functions/*', 'web/*', 'coverage/*'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/tokens.ts'],
    rules: {
      // Design-system rule: colours come from src/theme only.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?$/]',
          message: 'Hard-coded colour. Use a token from src/theme (useTheme().c).',
        },
        {
          selector: 'Literal[value=/^(rgb|rgba|hsl|hsla)\\(/]',
          message: 'Hard-coded colour. Use a token from src/theme.',
        },
      ],
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'react-native', importNames: ['SafeAreaView'], message: 'Use react-native-safe-area-context.' }] },
      ],
    },
  },
]);
