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

test.describe('US12 — Listagem global pelo administrador', () => {
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
    await app.auth.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  // TC01 — Administrador lista todas as reservas (CT01,CT04) · Ambas · Positivo
  test('TC01 — Administrador vê todas as reservas na listagem global (CT01, CT04)', async ({ app, page }) => {
    await app.admin.goToAdmin();
    const cards = page.locator('article.card');
    await expect(cards).toHaveCount(1);
  });

  // TC02 — Administrador filtra listagem global por intervalo (CT02) · Ambas · Positivo
  test('TC02 — Administrador filtra reservas por intervalo de datas (CT02)', async ({ app, page }) => {
    await app.admin.goToAdmin();
    await app.admin.filterByDateRange(tomorrow(), tomorrow());
    const cards = page.locator('article.card');
    await expect(cards).toHaveCount(1);
  });

  // TC05 — Filtros adicionais por status na UI admin (CT05) · Web · Positivo
  test('TC05 — Filtro por status ativa exibe apenas reservas ativas (CT05)', async ({ app, page }) => {
    await app.admin.goToAdmin();
    await app.admin.filterByStatus('ativa');
    const cards = page.locator('article.card');
    await expect(cards).toHaveCount(1);
  });
});
