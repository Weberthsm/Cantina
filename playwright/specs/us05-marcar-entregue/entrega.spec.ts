import { test, expect } from '../../support/fixtures';
import {
  resetApp,
  tomorrow,
  loginViaAPI,
  updateProfileViaAPI,
  createReservationViaAPI,
} from '../../support/helpers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const CLIENT_EMAIL = process.env.CLIENT_EMAIL!;
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD!;

test.describe('US05 — Marcar como entregue (administrador)', () => {
  let reservationId: string;

  test.beforeEach(async ({ app }) => {
    await resetApp();
    const clientToken = await loginViaAPI(CLIENT_EMAIL, CLIENT_PASSWORD);
    await updateProfileViaAPI(clientToken, {
      name: 'Cliente Exemplo',
      cpf: '11111111111',
      phone: '11999999999',
      address: 'Rua Exemplo, 123',
    });
    reservationId = await createReservationViaAPI(clientToken, tomorrow(), 'almoco');
    await app.auth.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  // TC01 — Administrador marca reserva ativa como entregue (CT01,CT02,CT04) · Ambas · Positivo
  test('TC01 — Administrador marca reserva ativa como entregue (CT01, CT02, CT04)', async ({ app, page }) => {
    await app.admin.goToAdmin();
    await app.admin.deliverReservation(reservationId);
    await expect(page.getByTestId('toast-title').first()).toContainText('Sucesso');
  });

  // TC05 — Confirmação visual antes da entrega (CT05) · Web · Borda
  test('TC05 — Diálogo de confirmação exibido antes de marcar entregue (CT05)', async ({ app, page }) => {
    await app.admin.goToAdmin();
    await page.getByTestId(`btn-deliver-${reservationId}`).click();
    await expect(page.getByTestId('confirm-dialog-confirm')).toBeVisible();
    // Cancela sem confirmar
    await page.getByTestId('confirm-dialog-cancel').click();
    await expect(page.getByTestId('confirm-dialog-confirm')).not.toBeVisible();
  });
});
