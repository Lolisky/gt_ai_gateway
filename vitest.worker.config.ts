import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', '**/*.node.test.ts'],
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    // Run tests sequentially to avoid database and port conflicts
    pool: 'forks',
    fileParallelism: false,
    // Increase hookTimeout for wrangler dev startup time
    hookTimeout: 120000,
    testTimeout: 60000,
    // Pass TEST_MODE to forked processes (Vitest 4 syntax)
    execArgv: [],
    isolate: false,
    env: {
      TEST_MODE: 'worker',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['node_modules', '**/*.test.ts', '**/*.spec.ts', 'tests/**'],
    },
  },
})
