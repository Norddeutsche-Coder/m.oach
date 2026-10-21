import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/legacy/**', 'legacy-app/**', 'tests/**', 'dist/**'],
    environment: 'node',
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,ts,tsx}'],
      exclude: [
        'src/legacy/**',
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/test/**',
      ],
      thresholds: {
        lines: 43,
        functions: 32,
        'src/features/plan/**': {
          lines: 90,
          perFile: true,
        },
        'src/features/runs/**': {
          lines: 90,
          perFile: true,
        },
      },
    },
  },
})
