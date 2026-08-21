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

test('müşteri listesi boş gelmez ve tabloda görünür', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Müşteriler' }).click()
  await expect(page.getByText('Müşteri Listesi')).toBeVisible()
  const rows = page.locator('.ant-table-tbody tr')
  await expect(rows.first()).toBeVisible()
  expect(await rows.count()).toBeGreaterThan(0)
  await expect(page.getByRole('button', { name: 'Yeni Müşteri' })).toBeVisible()
})

test('yeni kayıt menüsü oluşturma formunu açar', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Destek Kayıtları' }).click()
  await page.getByRole('button', { name: 'Aç' }).first().click()
  await expect(page.locator('.ant-tabs-nav')).toBeVisible()

  await page.getByLabel('Yeni kayıt').click()
  await page.getByRole('menuitem', { name: 'Yeni Destek Kaydı' }).click()
  await expect(page.getByRole('dialog')).toContainText('Yeni Destek Kaydı')
  await page.getByRole('button', { name: 'Vazgeç' }).click()

  await page.getByLabel('Yeni kayıt').click()
  await page.getByRole('menuitem', { name: 'Yeni Görev' }).click()
  await expect(page.getByRole('dialog')).toContainText('Yeni Görev')
  await page.getByRole('button', { name: 'Vazgeç' }).click()
})

test('aktif sekmeye tıklayınca kayıt görünümü kapanır ve liste açık kalır', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Destek Kayıtları' }).click()
  await page.getByRole('button', { name: 'Aç' }).first().click()
  const activeTab = page.locator('.ant-tabs-tab-active')
  await expect(activeTab).toBeVisible()
  await expect(page.locator('.ant-descriptions')).toBeVisible()

  await activeTab.click()
  await expect(page.locator('.ant-descriptions')).toBeHidden()
  await expect(page.locator('.ant-table')).toBeVisible()
  await expect(page.locator('.ant-tabs-tab-active')).toBeVisible()
})

test('ticket yorumu sekmede kaydedilir ve geçmiş anında güncellenir', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Destek Kayıtları' }).click()
  await page.getByRole('button', { name: 'Aç' }).first().click()
  await expect(page.locator('.ant-tabs-tab-active')).toBeVisible()

  const marker = `e2e yorum ${Date.now()}`
  await page.getByRole('button', { name: 'Yorum Ekle' }).click()
  await page.getByRole('textbox', { name: /Yorum/ }).fill(marker)
  await page.getByRole('button', { name: 'Ekle', exact: true }).click()
  await expect(page.getByText('Yorum eklendi.')).toBeVisible()
  await expect(page.getByText(marker)).toBeVisible()
  await expect(page.locator('.ant-tabs-tab-active')).toBeVisible()
})

test('görev detayı sekmede kaydedilir ve kapanması gerekmez', async ({ page }) => {
  const token = await apiClient.login('admin', 'admin123')
  const tasks = await apiClient.get<{ id: number; description: string | null }[]>('/tasks', token)
  const firstTask = tasks[0]

  await page.getByRole('menuitem', { name: 'Görevler' }).click()
  await page.locator('.ant-card-hoverable').first().click()
  await expect(page.locator('.ant-tabs-tab-active')).toBeVisible()

  const draft = `e2e detay ${Date.now()}`
  const textarea = page.getByPlaceholder('Açıklama girin...')
  await textarea.fill(draft)
  await page.getByRole('button', { name: 'Detay Kaydet' }).click()
  await expect(page.getByText('Açıklama kaydedildi.')).toBeVisible()
  await expect(textarea).toHaveValue(draft)
  await expect(page.locator('.ant-tabs-tab-active')).toBeVisible()

  await apiClient.patch(`/tasks/${firstTask.id}`, { description: firstTask.description }, token)
})
