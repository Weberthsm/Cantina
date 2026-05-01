import { test, expect } from '../../support/fixtures';
import {
  resetApp,
  tomorrow,
  loginViaAPI,
  updateProfileViaAPI,
  createReservationViaAPI,
} from '../../support/helpers';

const CLIENT_EMAIL = process.env.CLIENT_EMAIL!;
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD!;

test.describe('US03 — Cancelamento de reserva (cliente)', () => {
  let clientToken: string;
  let reservationId: string;

  test.beforeEach(async ({ app }) => {
    await resetApp();
    clientToken = await loginViaAPI(CLIENT_EMAIL, CLIENT_PASSWORD);
    await updateProfileViaAPI(clientToken, {
      name: 'Cliente Exemplo',
      cpf: '11111111111',
      phone: '11999999999',
      address: 'Rua Exemplo, 123',
    });
    reservationId = await createReservationViaAPI(clientToken, tomorrow(), 'jantar');
    await app.auth.login(CLIENT_EMAIL, CLIENT_PASSWORD);
  });

  // TC01 — Cliente cancela reserva própria antes do horário de corte (CT01,CT06,CT07) · Ambas · Positivo
  test('TC01 — Cliente cancela reserva própria antes do horário de corte (CT01, CT06, CT07)', async ({ app, page }) => {
    await app.reservation.goToList();
    await page.getByTestId(`btn-cancel-reservation-${reservationId}`).click();
    await expect(page.getByTestId('confirm-dialog-confirm')).toBeVisible();
    await page.getByTestId('confirm-dialog-confirm').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('toast-title').first()).toBeVisible();
  });

  // TC06 — Confirmação visual antes do cancelamento (CT08) · Web · Borda
  test('TC06 — Diálogo de confirmação aparece antes de cancelar (CT08)', async ({ app, page }) => {
    await app.reservation.goToList();
    await page.getByTestId(`btn-cancel-reservation-${reservationId}`).click();
    // Diálogo de confirmação visível
    await expect(page.getByTestId('confirm-dialog-confirm')).toBeVisible();
    await expect(page.getByTestId('confirm-dialog-cancel')).toBeVisible();
    // Clica em cancelar — não deve cancelar a reserva
    await page.getByTestId('confirm-dialog-cancel').click();
    await expect(page.getByTestId('confirm-dialog-confirm')).not.toBeVisible();
  });
});
