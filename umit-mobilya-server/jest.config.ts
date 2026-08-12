import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  /*
   * Only .ts goes through ts-jest. The not-yet-ported CommonJS files under
   * routes/, controllers/ and models/ are plain JavaScript that Node already
   * runs as-is; handing them to the TypeScript compiler produces a warning per
   * file and buys nothing.
   */
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  transformIgnorePatterns: ['/node_modules/', '\\.js$'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  /*
   * Excluded on purpose:
   * - `tools/` is a build script, run by `yarn schema:dump`, not by the app
   * - `main.ts` is the bootstrap; `createTestApp` exercises the same setup
   * - `*.module.ts` is wiring with no branches — counting it inflates the
   *   number without measuring anything
   */
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tools/**',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  /*
   * A floor, not a target. The numbers sit just under what the suite actually
   * achieves, so the gate fires when coverage *slides* rather than nagging
   * about the last few percent.
   *
   * The two path entries are deliberately absolute: the guard decides who gets
   * in and the pipe decides what a valid id is. A branch missed there is a
   * security hole or a 500, not a style nit. Note that files matched by a path
   * entry are removed from the global calculation.
   */
  coverageThreshold: {
    'src/auth/guards/**': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'src/common/pipes/**': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    global: {
      statements: 93,
      branches: 73,
      functions: 92,
      lines: 94,
    },
  },
  testEnvironment: 'node',
  testTimeout: 30000,
};

export default config;
