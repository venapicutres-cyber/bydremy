import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('admin guestbook requires administrator sign-in', async ({ app, screen }) => {
  await app.open('/admin/guestbook');

  await expect(screen.getByRole('heading', 'Masuk ke Dashboard')).toBeVisible();
  await expect(screen.getByRole('textbox', 'Email')).toBeVisible();
  await expect(screen.getByRole('button', 'Masuk Dashboard')).toBeVisible();
});