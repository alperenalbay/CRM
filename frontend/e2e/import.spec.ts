import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Kullanıcı Adı')).toBeVisible()
  await page.getByLabel('Kullanıcı Adı').fill('admin')
  await page.getByLabel('Şifre').fill('admin123')
  await page.getByRole('button', { name: 'Giriş Yap' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('imports customers from a csv file', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Veri Aktarımı' }).click()

  const taxNo = String(Date.now()).slice(-10)
  const csv = `company_name,tax_no,email,city\nE2E Import Co,${taxNo},e2e@test.com,Istanbul\n`
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'customers.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })

  await expect(page.getByText(/Dosya geçerli: 1 satır bulundu/)).toBeVisible()
  await page.getByRole('button', { name: 'Import Et' }).click()

  await expect(page.getByText(/Import: 1 başarılı, 0 hatalı/)).toBeVisible()
})
