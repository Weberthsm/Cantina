import { Page, expect } from '@playwright/test';

export function createProfileActions(page: Page) {
  return {
    async goToProfile() {
      await page.goto('/perfil');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: /Salvar/ })).toBeVisible();
    },

    async fillProfile(data: {
      name?: string;
      cpf?: string;
      phone?: string;
      address?: string;
    }) {
      if (data.name !== undefined) {
        // Primeiro input[type="text"] obrigatório = Nome completo
        await page.locator('input[required][type="text"]').fill(data.name);
      }
      if (data.cpf !== undefined) {
        await page.getByPlaceholder('00000000000').fill(data.cpf);
      }
      if (data.phone !== undefined) {
        await page.getByPlaceholder('(11) 99999-9999').fill(data.phone);
      }
      if (data.address !== undefined) {
        await page.getByPlaceholder('Rua, número, bairro').fill(data.address);
      }
    },

    async save() {
      await page.getByRole('button', { name: /Salvar/ }).click();
    },

    async update(data: {
      name?: string;
      cpf?: string;
      phone?: string;
      address?: string;
    }) {
      await this.goToProfile();
      await this.fillProfile(data);
      await this.save();
    },

    async expectEmailDisplayed(email: string) {
      await expect(page.getByText(email)).toBeVisible();
    },

    async expectProfileWarningOnNewReservation() {
      await page.goto('/reservas/nova');
      await expect(
        page.getByText('Complete seu perfil antes de reservar')
      ).toBeVisible();
    },
  };
}
