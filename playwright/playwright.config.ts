import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

const env = process.env.TEST_ENV || 'dev';
dotenv.config({ path: path.resolve(__dirname, `env/.env.${env}`) });

const apiUrl  = process.env.API_BASE_URL || 'http://localhost:3000';
const baseUrl = process.env.BASE_URL     || 'http://localhost:5173';

export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 5_000 },
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],

  // Backend: sempre sobe o próprio servidor com NODE_ENV=test.
  // reuseExistingServer: false → se a porta 3000 já estiver ocupada (ex: servidor do VS Code),
  // o Playwright avisa para pará-lo antes de rodar os testes.
  // Isso garante que o endpoint POST /test/reset esteja sempre disponível.
  //
  // Frontend: pode reutilizar instância existente (não precisa de NODE_ENV=test).
  webServer: [
    {
      command: 'node server.js',
      url: `${apiUrl}/`,
      env: { NODE_ENV: 'test' },
      reuseExistingServer: false,
      cwd: path.resolve(__dirname, '..'),
      timeout: 15_000,
    },
    {
      command: 'npm run dev',
      url: baseUrl,
      reuseExistingServer: true,
      cwd: path.resolve(__dirname, '../frontend'),
      timeout: 30_000,
    },
  ],

  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry',
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
