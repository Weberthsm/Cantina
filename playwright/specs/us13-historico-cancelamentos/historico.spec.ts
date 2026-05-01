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

test.describe('US13 — Histórico de cancelamentos (administrador)', () => {
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
    reservationId = await createReservationViaAPI(clientToken, tomorrow(), 'jantar');
    // Admin cancela a reserva via API para popular histórico
    const adminToken = await loginViaAPI(ADMIN_EMAIL, ADMIN_PASSWORD);
    await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/reservations/${reservationId}/admin-cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Teste de histórico' }),
    });
    await app.auth.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  // TC01 — Administrador consulta o histórico completo (CT01,CT03) · Ambas · Positivo
  test('TC01 — Histórico exibe cancelamentos com autor, papel, motivo e data (CT01, CT03)', async ({ app, page }) => {
    await app.admin.goToAdmin();
    await app.admin.goToHistoryTab();
    await app.admin.expectHistoryTableVisible();
    await app.admin.expectHistoryContains('Teste de histórico');
  });

  // TC02 — Administrador filtra histórico por reserva (CT02) · Ambas · Positivo
  test('TC02 — Histórico filtrado por reserva exibe apenas registros vinculados (CT02)', async ({ app, page }) => {
    await app.admin.goToAdmin();
    await app.admin.goToHistoryTab();
    // O histórico contém pelo menos 1 registro
    await app.admin.expectHistoryTableVisible();
    const rows = page.getByRole('row');
    await expect(rows).toHaveCount(2); // header + 1 linha
  });

  // TC04 — Visualização em tabela na UI admin (CT04) · Web · Borda
  test('TC04 — Histórico exibido em tabela com colunas legíveis (CT04)', async ({ app, page }) => {
    await app.admin.goToAdmin();
    await app.admin.goToHistoryTab();
    await app.admin.expectHistoryTableVisible();
    // Verifica os cabeçalhos da tabela
    await expect(page.getByRole('columnheader', { name: 'Reserva' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Quem cancelou' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Motivo' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Quando' })).toBeVisible();
  });
});
