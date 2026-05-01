import { Page, expect } from '@playwright/test';

export function createReservationActions(page: Page) {
  return {
    async goToNew() {
      await page.goto('/reservas/nova');
      await page.waitForLoadState('networkidle');
    },

    async goToList() {
      await page.goto('/reservas');
      await page.waitForLoadState('networkidle');
    },

    async selectDate(date: string) {
      const dateInput = page.locator('input[type="date"]').first();
      await dateInput.waitFor({ state: 'visible', timeout: 10_000 });
      await dateInput.fill(date);
      await page.waitForLoadState('networkidle');
    },

    async selectMealType(mealType: 'almoco' | 'jantar') {
      await page.locator(`label:has(input[value="${mealType}"])`).click();
    },

    async setQuantity(qty: number) {
      const input = page.getByTestId('quantity-input');
      await input.fill(String(qty));
    },

    async submit() {
      await page.getByRole('button', { name: /Confirmar/ }).click();
    },

    async create(date: string, mealType: 'almoco' | 'jantar', quantity = 1) {
      await this.goToNew();
      await this.selectDate(date);
      await this.selectMealType(mealType);
      await this.setQuantity(quantity);
      await this.submit();
    },

    async cancelReservation(reservationId: string) {
      await page.getByTestId(`btn-cancel-reservation-${reservationId}`).click();
      await page.getByTestId('confirm-dialog-confirm').click();
      await page.waitForLoadState('networkidle');
    },

    async expectAvailabilityBadge(mealType: 'almoco' | 'jantar', text: string | RegExp) {
      await expect(
        page.getByTestId(`availability-badge-${mealType}`)
      ).toContainText(text);
    },

    async expectMaxQuantity(max: number) {
      const input = page.getByTestId('quantity-input');
      await expect(input).toHaveAttribute('max', String(max));
    },

    async expectEmptyState() {
      await expect(page.getByText('Nenhuma reserva encontrada')).toBeVisible();
    },

    async expectReservationCount(count: number) {
      const cards = page.locator('article.card');
      await expect(cards).toHaveCount(count);
    },

    async filterByDate(from: string, to: string) {
      await page.locator('input[type="date"]').nth(0).fill(from);
      await page.locator('input[type="date"]').nth(1).fill(to);
      await page.getByRole('button', { name: 'Filtrar' }).click();
      await page.waitForLoadState('networkidle');
    },
  };
}
