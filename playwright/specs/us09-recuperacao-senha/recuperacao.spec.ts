import { test, expect } from '../../support/fixtures';
import { resetApp } from '../../support/helpers';

const CLIENT_EMAIL = process.env.CLIENT_EMAIL!;
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD!;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('US09 — Recuperação de senha', () => {
  test.beforeEach(async () => {
    await resetApp();
  });

  // TC01 — Solicitação de recuperação para e-mail cadastrado (CT01) · Ambas · Positivo
  test('TC01 — Solicitação de recuperação gera token (CT01)', async ({ app, page }) => {
    await app.auth.goToForgotPassword();
    await app.auth.submitForgotPassword(CLIENT_EMAIL);
    await page.waitForLoadState('networkidle');
    // A API retorna token em dev — a UI mostra feedback de sucesso
    await expect(page.getByTestId('toast-title').first()).toBeVisible();
  });

  // TC03 — Reset com token válido (CT04) · Ambas · Positivo
  test('TC03 — Reset de senha com token válido permite novo login (CT04)', async ({ app, page }) => {
    // Solicita token via API diretamente
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: CLIENT_EMAIL }),
    });
    const data = await res.json();
    const token = data.recoveryToken as string;

    await app.auth.goToResetPassword(token);
    await app.auth.submitResetPassword('NovaSenha123');
    await page.waitForLoadState('networkidle');

    // Deve conseguir logar com a nova senha
    await app.auth.login(CLIENT_EMAIL, 'NovaSenha123');
    await app.auth.expectOnDashboard();
  });

  // TC08 — UI de solicitação e redefinição com feedback (CT07) · Web · Borda
  test('TC08 — Telas de recuperação exibem feedback claro (CT07)', async ({ app, page }) => {
    await app.auth.goToForgotPassword();
    await app.auth.submitForgotPassword(CLIENT_EMAIL);
    // Verifica que algum feedback (toast ou mensagem) é exibido
    await page.waitForLoadState('networkidle');
    const hasFeedback =
      (await page.getByTestId('toast-title').first().isVisible().catch(() => false)) ||
      (await page.getByText(/enviado|sucesso|verifique/i).isVisible().catch(() => false));
    expect(hasFeedback).toBeTruthy();
  });
});
