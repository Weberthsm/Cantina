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

test.describe('US11 — Detalhe de uma reserva', () => {
  test.beforeEach(async ({ app }) => {
    await resetApp();
    const clientToken = await loginViaAPI(CLIENT_EMAIL, CLIENT_PASSWORD);
    await updateProfileViaAPI(clientToken, {
      name: 'Cliente Exemplo',
      cpf: '11111111111',
      phone: '11999999999',
      address: 'Rua Exemplo, 123',
    });
    await createReservationViaAPI(clientToken, tomorrow(), 'almoco');
    await app.auth.login(CLIENT_EMAIL, CLIENT_PASSWORD);
  });

  // TC01 — Cliente consulta detalhe de reserva própria (CT01,CT04) · Ambas · Positivo
  test('TC01 — Cliente vê detalhes da sua reserva na listagem (CT01, CT04)', async ({ app, page }) => {
    await app.reservation.goToList();
    const cards = page.locator('article.card');
    await expect(cards).toHaveCount(1);
    // Verifica que o card contém data e tipo de refeição
    await expect(cards.first()).toContainText(tomorrow().split('-').reverse().join('/'));
    await expect(cards.first()).toContainText(/Almoço/i);
  });

  // TC05 — Apresentação amigável de data/hora na UI (CT05) · Web · Borda
  test('TC05 — Data da reserva é exibida em formato local legível (CT05)', async ({ app, page }) => {
    await app.reservation.goToList();
    const cards = page.locator('article.card');
    // Data no formato dd/mm/yyyy
    const dateText = await cards.first().textContent();
    expect(dateText).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
