import { expect, test } from '@playwright/test'
import { apiClient } from './helpers'

test.describe('kullanıcı yönetimi ve RBAC', () => {
  let adminToken: string
  let roUserId: number
  const roUsername = `e2e_ro_${Date.now()}`

  test.beforeAll(async () => {
    adminToken = await apiClient.login('admin', 'admin123')
  })

  test.afterAll(async () => {
    await apiClient.patch(`/users/${roUserId}`, { is_active: true }, adminToken)
    await apiClient.patch(`/users/${roUserId}`, { is_active: false }, adminToken)
  })

  test('admin kullanıcılar sayfasını açar ve kullanıcı oluşturur', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Kullanıcı Adı').fill('admin')
    await page.getByLabel('Şifre').fill('admin123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.getByRole('menuitem', { name: 'Kullanıcılar' }).click()
    await expect(page.getByRole('tab', { name: 'Kullanıcılar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Yeni Kullanıcı' })).toBeVisible()

    await page.getByRole('button', { name: 'Yeni Kullanıcı' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel('Kullanıcı Adı').fill(roUsername)
    await page.getByLabel('Ad Soyad').fill('E2E Salt Okunur')
    await page.getByLabel('Şifre').fill('E2ePass123')
    await page.getByRole('button', { name: 'Tamam' }).click()
    await expect(page.getByText(roUsername)).toBeVisible()

    const list = await apiClient.get('/users', adminToken)
    const created = list.find((u: { username: string }) => u.username === roUsername)
    expect(created).toBeDefined()
    roUserId = created.id

    const groups = await apiClient.get('/groups', adminToken)
    const roGroup = groups.find((g: { code: string }) => g.code === 'salt_okunur')
    await apiClient.patch(
      `/users/${roUserId}`,
      { group_ids: [roGroup.id] },
      adminToken,
    )
  })

  test('salt okunur kullanıcı menü ve butonları göremez', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Kullanıcı Adı').fill(roUsername)
    await page.getByLabel('Şifre').fill('E2ePass123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    await expect(page.getByRole('menuitem', { name: 'Kullanıcılar' })).toHaveCount(0)
    await page.getByRole('menuitem', { name: 'Müşteriler' }).click()
    await expect(page.getByRole('button', { name: 'Yeni Müşteri' })).toHaveCount(0)
  })

  test('admin yetki grubu oluşturur', async ({ page }) => {
    const groupName = `E2E Grubu ${Date.now()}`
    await page.goto('/login')
    await page.getByLabel('Kullanıcı Adı').fill('admin')
    await page.getByLabel('Şifre').fill('admin123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.getByRole('menuitem', { name: 'Kullanıcılar' }).click()
    await page.getByRole('tab', { name: 'Yetki Grupları' }).click()
    await page.getByRole('button', { name: 'Yeni Grup' }).click()
    await page.getByLabel('Kod').fill(`e2e_group_${Date.now()}`)
    await page.getByLabel('Ad').fill(groupName)
    await page.getByRole('button', { name: 'Tamam' }).click()
    await expect(page.getByText(groupName)).toBeVisible()
  })
})
