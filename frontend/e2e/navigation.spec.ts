import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Kullanıcı Adı')).toBeVisible()
  await page.getByLabel('Kullanıcı Adı').fill('admin')
  await page.getByLabel('Şifre').fill('admin123')
  await page.getByRole('button', { name: 'Giriş Yap' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('customers page loads', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Müşteriler' }).click()
  await expect(page.getByRole('button', { name: 'Yeni Müşteri' })).toBeVisible()
})

test('tickets page loads', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Destek Kayıtları' }).click()
  await expect(page.getByRole('button', { name: 'Yeni Kayıt' })).toBeVisible()
})

test('tasks kanban loads', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Görevler' }).click()
  await expect(page.getByRole('heading', { name: 'Görev Panosu' })).toBeVisible()
})

test('sales page loads', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Satışlar' }).click()
  await expect(page.getByRole('heading', { name: 'Satış Emirleri' })).toBeVisible()
})

test('import page loads', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Veri Aktarımı' }).click()
  await expect(page.getByText('Mevcut CRM Veri Aktarımı')).toBeVisible()
})
