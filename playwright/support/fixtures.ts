import { test as base } from '@playwright/test';
import { createAuthActions } from './actions/authActions';
import { createReservationActions } from './actions/reservationActions';
import { createProfileActions } from './actions/profileActions';
import { createAdminActions } from './actions/adminActions';

type App = {
  auth: ReturnType<typeof createAuthActions>;
  reservation: ReturnType<typeof createReservationActions>;
  profile: ReturnType<typeof createProfileActions>;
  admin: ReturnType<typeof createAdminActions>;
};

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    await use({
      auth: createAuthActions(page),
      reservation: createReservationActions(page),
      profile: createProfileActions(page),
      admin: createAdminActions(page),
    });
  },
});

export { expect } from '@playwright/test';
