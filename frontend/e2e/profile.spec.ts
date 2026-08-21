import { expect, test } from '@playwright/test'

test.describe('profil menüsü, durum ve tema', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Kullanıcı Adı').fill('admin')
    await page.getByLabel('Şifre').fill('admin123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('kullanıcı menüsü açılır ve öğeleri görünür', async ({ page }) => {
    await page.getByRole('button', { name: /down/ }).click()
    await expect(page.getByTitle('Durum')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Uygun' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Koyu Tema' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Şifre Değiştir' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Çıkış Yap' })).toBeVisible()
  })

  test('sağ panel kullanıcı adı ve bugünkü işlemleri gösterir', async ({ page }) => {
    await expect(page.getByText('Bugünkü İşlemler')).toBeVisible()
  })

  test('durum değişince isim yanında parantez içinde gösterilir', async ({ page }) => {
    await page.getByRole('button', { name: /down/ }).click()
    await page.getByRole('menuitem', { name: 'Yemekte' }).click()
    await expect(page.getByText('(Yemekte)')).toBeVisible()

    await page.getByRole('button', { name: /down/ }).click()
    await page.getByRole('menuitem', { name: 'Uygun' }).click()
    await expect(page.getByText('(Yemekte)')).toHaveCount(0)
  })

  test('tema koyu/aydınlık değişir ve kalıcıdır', async ({ page }) => {
    await page.getByRole('button', { name: /down/ }).click()
    await page.getByRole('menuitem', { name: 'Koyu Tema' }).click()
    await expect
      .poll(() => page.evaluate(() => document.body.style.background))
      .toBe('rgb(0, 0, 0)')

    await page.reload()
    await expect(page).toHaveURL(/\/dashboard/)
    await expect
      .poll(() => page.evaluate(() => document.body.style.background))
      .toBe('rgb(0, 0, 0)')

    await page.getByRole('button', { name: /down/ }).click()
    await page.getByRole('menuitem', { name: 'Açık Tema' }).click()
    await expect
      .poll(() => page.evaluate(() => document.body.style.background))
      .toBe('rgb(245, 245, 245)')
  })

  test('şifre değiştir modal açılır ve boş alan uyarısı verir', async ({ page }) => {
    await page.getByRole('button', { name: /down/ }).click()
    await page.getByRole('menuitem', { name: 'Şifre Değiştir' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Mevcut şifrenizi girin.')).toBeVisible()
    await page.getByRole('button', { name: 'Vazgeç' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('çıkış yap login sayfasına yönlendirir', async ({ page }) => {
    await page.getByRole('button', { name: /down/ }).click()
    await page.getByRole('menuitem', { name: 'Çıkış Yap' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
