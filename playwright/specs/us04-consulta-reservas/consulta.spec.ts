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

test.describe('US04 — Consultar reservas por data', () => {
  let clientToken: string;

  test.beforeEach(async ({ app }) => {
    await resetApp();
    clientToken = await loginViaAPI(CLIENT_EMAIL, CLIENT_PASSWORD);
    await updateProfileViaAPI(clientToken, {
      name: 'Cliente Exemplo',
      cpf: '11111111111',
      phone: '11999999999',
      address: 'Rua Exemplo, 123',
    });
    await createReservationViaAPI(clientToken, tomorrow(), 'almoco');
    await app.auth.login(CLIENT_EMAIL, CLIENT_PASSWORD);
  });

  // TC01 — Cliente lista suas reservas em um intervalo (CT01,CT02,CT04,CT05) · Ambas · Positivo
  test('TC01 — Cliente lista suas reservas em um intervalo (CT01, CT02, CT04, CT05)', async ({ app, page }) => {
    await app.reservation.goToList();
    const cards = page.locator('article.card');
    await expect(cards).toHaveCount(1);
  });

  // TC04 — Lista vazia retorna empty state amigável (CT06) · Web · Borda
  test('TC04 — Lista vazia exibe empty state com call-to-action (CT06)', async ({ app, page }) => {
    await app.reservation.goToList();
    // Filtra por uma data sem reservas
    const pastDate = '2020-01-01';
    await app.reservation.filterByDate(pastDate, pastDate);
    await expect(page.getByText('Nenhuma reserva encontrada')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar reserva' })).toBeVisible();
  });
});
