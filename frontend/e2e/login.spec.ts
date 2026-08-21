import { expect, test } from '@playwright/test'

test('valid credentials open the dashboard', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Kullanıcı Adı').fill('admin')
  await page.getByLabel('Şifre').fill('admin123')
  await page.getByRole('button', { name: 'Giriş Yap' }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('Son Destek Kayıtları')).toBeVisible()
})

test('wrong password shows an error', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Kullanıcı Adı')).toBeVisible()

  await page.getByLabel('Kullanıcı Adı').fill('admin')
  await page.getByLabel('Şifre').fill('yanlis-sifre')
  await page.getByRole('button', { name: 'Giriş Yap' }).click()

  await expect(page.getByText('Kullanıcı adı veya şifre hatalı.')).toBeVisible()
})
