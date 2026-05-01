import { Page, expect } from '@playwright/test';

export function createAdminActions(page: Page) {
  return {
    async goToAdmin() {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
    },

    async goToHistoryTab() {
      await page.getByRole('button', { name: 'Histórico de cancelamentos' }).click();
      await page.waitForLoadState('networkidle');
    },

    async deliverReservation(reservationId: string) {
      await page.getByTestId(`btn-deliver-${reservationId}`).click();
      await page.getByTestId('confirm-dialog-confirm').click();
      await page.waitForLoadState('networkidle');
    },

    async adminCancelReservation(reservationId: string, reason: string) {
      await page.getByTestId(`btn-admin-cancel-${reservationId}`).click();
      await page.getByTestId('cancel-reason-input').fill(reason);
      await page.getByTestId('confirm-dialog-confirm').click();
      await page.waitForLoadState('networkidle');
    },

    async filterByStatus(status: 'todas' | 'ativa' | 'entregue' | 'cancelada') {
      await page.locator('select').selectOption(status);
      await page.getByRole('button', { name: 'Filtrar' }).click();
      await page.waitForLoadState('networkidle');
    },

    async filterByDateRange(from: string, to: string) {
      await page.locator('input[type="date"]').nth(0).fill(from);
      await page.locator('input[type="date"]').nth(1).fill(to);
      await page.getByRole('button', { name: 'Filtrar' }).click();
      await page.waitForLoadState('networkidle');
    },

    async expectConfirmButtonDisabledWithoutReason() {
      await expect(page.getByTestId('confirm-dialog-confirm')).toBeDisabled();
    },

    async expectHistoryTableVisible() {
      await expect(page.getByRole('table')).toBeVisible();
    },

    async expectHistoryContains(text: string | RegExp) {
      await expect(page.getByRole('table')).toContainText(text);
    },

    async expectReservationCount(count: number) {
      const cards = page.locator('article.card');
      await expect(cards).toHaveCount(count);
    },
  };
}
