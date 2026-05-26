import { expect, test } from '@playwright/test'

test('smoke: la home carrega bé', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'RecoverIT' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Registrar-me' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Iniciar Sessió' })).toBeVisible()
})
