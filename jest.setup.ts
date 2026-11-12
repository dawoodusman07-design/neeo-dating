/// <reference types="jest" />
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Native-only SDK; services/purchases.ts falls back to the mock store when no key is set.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { isConfigured: jest.fn(async () => false), configure: jest.fn() },
}));
