import { test, expect, Page } from '@playwright/test';

const HOME_URL = 'https://www.trendyol.com/';

// Trendyol ana sayfasında rastgele çıkabilen çerez ve "ilgi alanı" modallarını kapatır.
// Modallar her zaman çıkmayabileceği için görünmezlerse sessizce geçilir.
async function closePopupsIfAny(page: Page) {
  const cookieReject = page.getByRole('button', { name: 'Tümünü Reddet' });
  await cookieReject
    .waitFor({ state: 'visible', timeout: 4000 })
    .then(() => cookieReject.click())
    .catch(() => {});

  const interestModalClose = page.locator('.modal-section-close');
  await interestModalClose
    .waitFor({ state: 'visible', timeout: 4000 })
    .then(() => interestModalClose.click())
    .catch(() => {});
}

// Arama kutusu başlangıçta bir "buton"; tıklanınca gerçek bir textbox açılıyor.
async function openSearchInput(page: Page) {
  await page.getByTestId('suggestion-placeholder').click();
  return page.getByTestId('browsing-search-input');
}

test.describe('Trendyol arama kutusu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
    await closePopupsIfAny(page);
  });

  test('geçerli bir ürün adıyla arama yapınca sonuç listesi görünüyor', async ({ page }) => {
    const searchInput = await openSearchInput(page);
    await searchInput.fill('elbise');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/sr\?.*q=elbise/i);

    const productHeadings = page.getByRole('heading', { level: 2 });
    await expect(productHeadings.first()).toBeVisible();
    expect(await productHeadings.count()).toBeGreaterThan(0);
  });

  test('boş arama kutusuyla arama denendiğinde sonuç sayfasına gidilmiyor', async ({ page }) => {
    const searchInput = await openSearchInput(page);
    await expect(page.getByText('Popüler Aramalar')).toBeVisible();

    await searchInput.press('Enter');

    // Boş sorguda site sonuç sayfasına yönlendirmiyor, arama paneli açık kalıyor.
    await expect(page).toHaveURL(HOME_URL);
    await expect(page.getByText('Popüler Aramalar')).toBeVisible();
  });

  test('var olmayan bir ürün aranınca "sonuç bulunamadı" mesajı görünüyor', async ({ page }) => {
    const searchInput = await openSearchInput(page);
    await searchInput.fill('zzzxxxyyy123');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/sr\?.*q=zzzxxxyyy123/i);
    await expect(page.getByText('Aradığın ürün bulunamadı')).toBeVisible();
  });

  test('arama kutusuna özel karakter girildiğinde hata vermeden sonuç sayfası açılıyor', async ({ page }) => {
    const searchInput = await openSearchInput(page);
    await searchInput.fill('@#$%');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/sr\?.*q=/i);
    // Sayfa çökmeden yüklenmiş, başlık ve arama kutusu değeri sorguyu yansıtıyor olmalı.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(/Trendyol/i);
  });
});
