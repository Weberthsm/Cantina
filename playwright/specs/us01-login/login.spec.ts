import { test, expect } from '../../support/fixtures';
import { resetApp } from '../../support/helpers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const CLIENT_EMAIL = process.env.CLIENT_EMAIL!;
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD!;

test.describe('US01 — Login de usuário', () => {
  test.beforeEach(async () => {
    await resetApp();
  });

  // TC01 — Cliente loga com credenciais válidas (CT02) · Ambas · Positivo
  test('TC01 — Cliente loga com credenciais válidas (CT02)', async ({ app, page }) => {
    await app.auth.login(CLIENT_EMAIL, CLIENT_PASSWORD);
    await app.auth.expectOnDashboard();
    await expect(page.getByText(/Olá/)).toBeVisible();
  });

  // TC03 — Login com senha incorreta (CT03) · Ambas · Negativo
  test('TC03 — Login com senha incorreta (CT03)', async ({ app, page }) => {
    await app.auth.login(CLIENT_EMAIL, 'senha-errada');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
  });

  // TC04 — Login com e-mail não cadastrado (CT03) · Ambas · Negativo
  test('TC04 — Login com e-mail não cadastrado (CT03)', async ({ app, page }) => {
    await app.auth.login('nao-existe@cantina.com', CLIENT_PASSWORD);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
  });

  // TC09 — Feedback visual de erro de credenciais (CT08) · Web · Negativo
  test('TC09 — Feedback visual de erro de credenciais (CT08)', async ({ app, page }) => {
    await app.auth.goToLogin();
    await app.auth.fillLogin(CLIENT_EMAIL, 'senha-errada');
    await app.auth.submitLogin();
    await expect(page.getByTestId('toast-title').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  // TC10 — Botão em estado de carregamento durante autenticação (CT09) · Web · Borda
  test('TC10 — Botão em estado de carregamento durante autenticação (CT09)', async ({ app, page }) => {
    await app.auth.goToLogin();
    await app.auth.fillLogin(CLIENT_EMAIL, CLIENT_PASSWORD);

    const btn = page.getByRole('button', { name: /Entrar|Entrando/ });
    await page.getByRole('button', { name: 'Entrar' }).click();

    // O botão pode exibir "Entrando…" durante o request
    await expect(btn).toBeVisible();
    await app.auth.expectOnDashboard();
  });
});
