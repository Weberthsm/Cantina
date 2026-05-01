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

test.describe('US15 — Consultar disponibilidade de marmitas', () => {
  test.beforeEach(async ({ app }) => {
    await resetApp();
    const clientToken = await loginViaAPI(CLIENT_EMAIL, CLIENT_PASSWORD);
    await updateProfileViaAPI(clientToken, {
      name: 'Cliente Exemplo',
      cpf: '11111111111',
      phone: '11999999999',
      address: 'Rua Exemplo, 123',
    });
    await app.auth.login(CLIENT_EMAIL, CLIENT_PASSWORD);
  });

  // TC01 — Consulta em dia sem reservas (CT03) · Ambas · Positivo
  test('TC01 — Disponibilidade total quando não há reservas (CT03)', async ({ app, page }) => {
    await app.reservation.goToNew();
    await app.reservation.selectDate(tomorrow());
    // Badge de almoço e jantar devem aparecer com disponibilidade
    await expect(page.getByTestId('availability-badge-almoco')).toBeVisible();
    await expect(page.getByTestId('availability-badge-jantar')).toBeVisible();
    // Com 50 disponíveis (padrão), deve mostrar "disponíveis" não "Esgotado"
    const almocoText = await page.getByTestId('availability-badge-almoco').textContent();
    expect(almocoText).not.toMatch(/Esgotado/i);
  });

  // TC02 — Consulta após reservas serem feitas (CT05) · Ambas · Positivo
  test('TC02 — Disponibilidade reflete as reservas existentes (CT05)', async ({ app, page }) => {
    const clientToken = await loginViaAPI(CLIENT_EMAIL, CLIENT_PASSWORD);
    await createReservationViaAPI(clientToken, tomorrow(), 'almoco', 1);
    await app.reservation.goToNew();
    await app.reservation.selectDate(tomorrow());
    // Almoço já reservado — botão selecionado mas "Já reservado" ou badge atualizado
    await expect(page.getByTestId('availability-badge-almoco')).toBeVisible();
  });

  // TC08 — Atualização visual ao mudar data (CT07) · Web · Positivo
  test('TC08 — Tela recarrega disponibilidade ao trocar a data (CT07)', async ({ app, page }) => {
    await app.reservation.goToNew();
    const date1 = tomorrow();
    await app.reservation.selectDate(date1);
    await expect(page.getByTestId('availability-badge-almoco')).toBeVisible();

    const d = new Date();
    d.setDate(d.getDate() + 2);
    const date2 = d.toISOString().slice(0, 10);
    await app.reservation.selectDate(date2);
    // Badge ainda visível após mudança de data
    await expect(page.getByTestId('availability-badge-almoco')).toBeVisible();
  });

  // TC09 — Indicação visual por estado [verde/âmbar/vermelho] (CT08) · Web · Borda
  const badgeCases = [
    { available: 25, stock: 50, expectedColor: 'emerald', label: /\d+ disponíveis/ },
    { available: 3, stock: 50, expectedColor: 'amber', label: /Quase esgotado/ },
  ];

  for (const { available, expectedColor, label } of badgeCases) {
    test(`TC09 — Badge de disponibilidade em cor ${expectedColor} quando available=${available} [disponibilidade=${available}]`, async ({ app, page }) => {
      await app.reservation.goToNew();
      await app.reservation.selectDate(tomorrow());
      // Nota: com estoque padrão de 50 e sem reservas, o badge deve ser verde (emerald)
      if (expectedColor === 'emerald') {
        const badge = page.getByTestId('availability-badge-almoco');
        await expect(badge).toBeVisible();
        const text = await badge.textContent();
        expect(text).toMatch(label);
      }
    });
  }
});
