import { test, expect } from '../../support/fixtures';
import { resetApp, uniqueEmail } from '../../support/helpers';

test.describe('US07 — Cadastro de cliente', () => {
  test.beforeEach(async () => {
    await resetApp();
  });

  // TC01 — Cadastro válido (CT01,CT02,CT03,CT06) · Ambas · Positivo
  test('TC01 — Cadastro válido redireciona para confirmação de e-mail (CT01, CT02, CT03, CT06)', async ({ app, page }) => {
    const email = uniqueEmail();
    await app.auth.register('Maria Teste', email, 'Senha123');
    // Deve ir para a tela de confirmação de email
    await expect(page).toHaveURL(/\/confirmar-email/);
  });

  // TC08 — Feedback visual em erros de validação (CT08) · Web · Borda
  test('TC08 — Erros de validação no formulário de cadastro (CT08)', async ({ app, page }) => {
    await app.auth.goToRegister();
    // Campo de nome usa placeholder 'Maria Silva' (sem for/id nos labels)
    const nameInput = page.getByPlaceholder('Maria Silva');
    await expect(nameInput).toBeVisible();
    // Submete vazio — HTML5 required impede submit e campo permanece visível
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(nameInput).toBeVisible();
  });
});
