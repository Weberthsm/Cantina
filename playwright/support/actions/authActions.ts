import { Page, expect } from '@playwright/test';

export function createAuthActions(page: Page) {
  return {
    async goToLogin() {
      await page.goto('/login');
      await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    },

    async fillLogin(email: string, password: string) {
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
    },

    async submitLogin() {
      await page.getByRole('button', { name: 'Entrar' }).click();
    },

    async login(email: string, password: string) {
      await this.goToLogin();
      await this.fillLogin(email, password);
      await this.submitLogin();
      await page.waitForLoadState('networkidle');
    },

    async goToRegister() {
      await page.goto('/cadastro');
      await expect(page.getByRole('button', { name: 'Cadastrar' })).toBeVisible();
    },

    async fillRegister(name: string, email: string, password: string) {
      await page.getByPlaceholder('Maria Silva').fill(name);
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
    },

    async submitRegister() {
      await page.getByRole('button', { name: 'Cadastrar' }).click();
    },

    async register(name: string, email: string, password: string) {
      await this.goToRegister();
      await this.fillRegister(name, email, password);
      await this.submitRegister();
    },

    async goToForgotPassword() {
      await page.goto('/recuperar-senha');
      await expect(page.getByRole('button', { name: 'Enviar token' })).toBeVisible();
    },

    async submitForgotPassword(email: string) {
      await page.locator('input[type="email"]').fill(email);
      await page.getByRole('button', { name: 'Enviar token' }).click();
    },

    async goToResetPassword(token: string) {
      await page.goto(`/redefinir-senha?token=${token}`);
      await expect(page.getByRole('button', { name: 'Redefinir senha' })).toBeVisible();
    },

    async submitResetPassword(password: string) {
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole('button', { name: 'Redefinir senha' }).click();
    },

    // Navega para a tela de confirmação com o token pré-preenchido e submete.
    async goToConfirmEmail(token: string) {
      await page.goto(`/confirmar-email?token=${token}`);
      await expect(page.getByRole('button', { name: 'Confirmar e-mail' })).toBeVisible();
      await page.getByRole('button', { name: 'Confirmar e-mail' }).click();
    },

    async logout() {
      await page.getByRole('button', { name: /Sair/ }).click();
    },

    async expectToastTitle(title: string) {
      await expect(page.getByTestId('toast-title').first()).toContainText(title);
    },

    async expectToastMessage(message: string) {
      await expect(page.getByTestId('toast-message').first()).toContainText(message);
    },

    async expectOnDashboard() {
      await page.waitForURL('/');
    },

    async expectOnLogin() {
      await page.waitForURL(/\/login/);
    },
  };
}
