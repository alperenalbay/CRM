import { expect, test } from '@playwright/test'
import { apiClient } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Kullanıcı Adı')).toBeVisible()
  await page.getByLabel('Kullanıcı Adı').fill('admin')
  await page.getByLabel('Şifre').fill('admin123')
  await page.getByRole('button', { name: 'Giriş Yap' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('sağ panel ekip durumunda birden fazla kullanıcıyı gösterir', async ({ page }) => {
  const listItems = page.locator('div[class*="ant-list-item"]')
  await expect(page.getByText('Ekip Durumu')).toBeVisible()
  await expect(listItems.first()).toBeVisible()
  expect(await listItems.count()).toBeGreaterThan(1)
})

test('ürün düzenlenir ve pasife alınır, yeniden aktife alınır', async ({ page }) => {
  const token = await apiClient.login('admin', 'admin123')
  const created = await apiClient.post<{ id: number; code: string }>(
    '/products',
    { code: `E2E-${Date.now()}`, name: 'E2E Test Ürün', unit_price: 10, vat_rate: 20, unit: 'adet' },
    token,
  )

  await page.getByRole('menuitem', { name: 'Satışlar' }).click()
  await page.getByRole('tab', { name: 'Ürünler' }).click()
  const row = page.locator('tr', { hasText: created.code })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Düzenle' }).click()
  await expect(page.getByRole('dialog')).toContainText('Ürün Düzenle')
  await page.getByLabel('Ad').fill('E2E Ürün Güncellendi')
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click()
  await expect(page.getByText('Ürün güncellendi.')).toBeVisible()
  await expect(row).toContainText('E2E Ürün Güncellendi')

  await row.getByRole('button', { name: 'Pasife Al' }).click()
  await page.getByRole('button', { name: 'Evet' }).click()
  await expect(page.getByText('Ürün pasife alındı.')).toBeVisible()
  await expect(row.getByText('Pasif')).toBeVisible()

  await row.getByRole('button', { name: 'Aktife Al' }).click()
  await page.getByRole('button', { name: 'Evet' }).click()
  await expect(page.getByText('Ürün aktife alındı.')).toBeVisible()
  await expect(row.getByText('Aktif')).toBeVisible()

  const token2 = await apiClient.login('admin', 'admin123')
  await apiClient.patch(`/products/${created.id}`, { is_active: false }, token2)
})
