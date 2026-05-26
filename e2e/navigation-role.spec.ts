import { expect, test, type Page } from '@playwright/test'

const patientEmail = process.env.E2E_PATIENT_EMAIL
const patientPassword = process.env.E2E_PATIENT_PASSWORD
const physioEmail = process.env.E2E_PHYSIO_EMAIL
const physioPassword = process.env.E2E_PHYSIO_PASSWORD

async function login(page: Page, email: string, password: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Iniciar Sessió' }).click()

  const emailInput = page.locator('input[type="email"]').first()
  await expect(emailInput).toBeVisible()
  await emailInput.fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.getByRole('button', { name: 'Iniciar sessió' }).click()

  await expect(page.getByRole('button', { name: 'Tancar sessió' })).toBeVisible({ timeout: 20_000 })
}

test('navegació pacient: sidebar base', async ({ page }) => {
  test.skip(!patientEmail || !patientPassword, 'Falten E2E_PATIENT_EMAIL / E2E_PATIENT_PASSWORD')

  await login(page, patientEmail!, patientPassword!)

  await expect(page.getByRole('button', { name: 'Inici' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Progrés i Historial' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exercicis en curs' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'El meu perfil' })).toBeVisible()

  await page.getByRole('button', { name: 'El meu perfil' }).click()
  await expect(page.getByText('Informació personal')).toBeVisible()
})

test('navegació fisioterapeuta: pestanyes de rol', async ({ page }) => {
  test.skip(!physioEmail || !physioPassword, 'Falten E2E_PHYSIO_EMAIL / E2E_PHYSIO_PASSWORD')

  await login(page, physioEmail!, physioPassword!)

  await expect(page.getByRole('button', { name: 'Inici' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pacients' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Xat' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Perfil' })).toBeVisible()

  await page.getByRole('button', { name: 'Pacients' }).click()
  await expect(page.getByRole('heading', { name: 'Pacients' })).toBeVisible()
})

test('navegació completa pacient: pantalles principals', async ({ page }) => {
  test.skip(!patientEmail || !patientPassword, 'Falten E2E_PATIENT_EMAIL / E2E_PATIENT_PASSWORD')

  await login(page, patientEmail!, patientPassword!)

  await page.getByRole('button', { name: 'Inici' }).click()
  await expect(page.getByText('Benvingut de nou')).toBeVisible()

  await page.getByRole('button', { name: 'Progrés i Historial' }).click()
  await expect(page.getByRole('heading', { name: 'Progrés i Historial' })).toBeVisible()

  await page.getByRole('button', { name: 'Exercicis en curs' }).click()
  await expect(page.getByRole('heading', { name: 'Exercicis en Curs' })).toBeVisible()

  await page.getByRole('button', { name: 'Historial de sessions' }).click()
  await expect(page.getByRole('heading', { name: 'Historial de sessions' })).toBeVisible()

  await page.getByRole('button', { name: 'El meu perfil' }).click()
  await expect(page.getByText('Informació personal')).toBeVisible()
})

test('navegació completa fisioterapeuta: pantalles principals', async ({ page }) => {
  test.skip(!physioEmail || !physioPassword, 'Falten E2E_PHYSIO_EMAIL / E2E_PHYSIO_PASSWORD')

  await login(page, physioEmail!, physioPassword!)

  await page.getByRole('button', { name: 'Inici' }).click()
  await expect(page.getByRole('heading', { name: 'Panell del fisioterapeuta' })).toBeVisible()

  await page.getByRole('button', { name: 'Pacients' }).click()
  await expect(page.getByRole('heading', { name: 'Pacients' })).toBeVisible()

  await page.getByRole('button', { name: 'Xat' }).click()
  await expect(page.getByRole('heading', { name: 'Xat amb pacients' })).toBeVisible()

  await page.getByRole('button', { name: 'Perfil' }).click()
  await expect(page.getByText('Informació personal')).toBeVisible()
})
