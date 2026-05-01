import { test, expect } from '../../support/fixtures';
import { resetApp, uniqueEmail, registerViaAPI } from '../../support/helpers';

test.describe('US08 — Confirmação de cadastro por e-mail', () => {
  test.beforeEach(async () => {
    await resetApp();
  });

  // TC01 — Confirmação com token válido (CT01) · Ambas · Positivo
  test('TC01 — Confirmação com token válido ativa a conta (CT01)', async ({ app, page }) => {
    const email = uniqueEmail();
    const token = await registerViaAPI('Novo Usuário', email, 'Senha123');
    // goToConfirmEmail navega e submete o formulário com o token pré-preenchido
    await app.auth.goToConfirmEmail(token);
    // Aguarda redirecionamento para login (após 1500ms no ConfirmEmailView)
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  });

  // TC04 — Indicação visual de sucesso (CT04) · Web · Borda
  test('TC04 — Feedback positivo após confirmação de e-mail (CT04)', async ({ app, page }) => {
    const email = uniqueEmail();
    const token = await registerViaAPI('Novo Usuário 2', email, 'Senha123');
    await app.auth.goToConfirmEmail(token);
    // Toast de sucesso deve aparecer antes do redirect
    await expect(page.getByTestId('toast-title').first()).toBeVisible();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  });
});
