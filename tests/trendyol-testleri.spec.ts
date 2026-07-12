import { test, expect, Page } from '@playwright/test';

const HOME_URL = 'https://www.trendyol.com/';
const SEARCH_URL = 'https://www.trendyol.com/sr?q=elbise';

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

test.describe('Trendyol arama, filtreleme ve ürün detay testleri', () => {
  test('1) Geçerli bir ürün adıyla arama yapınca sonuç listesi geliyor', async ({ page }) => {
    await page.goto(HOME_URL);
    await closePopupsIfAny(page);

    const searchInput = await openSearchInput(page);
    await searchInput.fill('elbise');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/sr\?.*q=elbise/i);

    const productHeadings = page.getByRole('heading', { level: 2 });
    await expect(productHeadings.first()).toBeVisible();
    expect(await productHeadings.count()).toBeGreaterThan(0);
  });

  test('2) Boş arama kutusuyla arama yapıldığında hata vermeden ana sayfada kalınıyor', async ({ page }) => {
    await page.goto(HOME_URL);
    await closePopupsIfAny(page);

    const searchInput = await openSearchInput(page);
    await expect(page.getByText('Popüler Aramalar')).toBeVisible();

    await searchInput.press('Enter');

    // Boş sorguda site sonuç sayfasına yönlendirmiyor, sayfa hatasız ana sayfada kalıyor.
    await expect(page).toHaveURL(HOME_URL);
    await expect(page.getByText('Popüler Aramalar')).toBeVisible();
  });

  test('3) Var olmayan bir ürün aranınca "sonuç bulunamadı" mesajı görünüyor', async ({ page }) => {
    await page.goto(HOME_URL);
    await closePopupsIfAny(page);

    const searchInput = await openSearchInput(page);
    await searchInput.fill('zzzxxxyyy123nonexistent');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/sr\?.*q=zzzxxxyyy123nonexistent/i);
    await expect(page.getByText('Aradığın ürün bulunamadı')).toBeVisible();
  });

  test('4) Mavi marka filtresi arama sonuçlarına uygulanabiliyor', async ({ page }) => {
    await page.goto(SEARCH_URL);
    await closePopupsIfAny(page);

    await page.getByRole('textbox', { name: 'Marka Ara' }).fill('Mavi');
    // Checkbox'a doğrudan force click, tüm tarayıcılarda site'ın click handler'ını
    // tetiklemiyor; bunun yerine checkbox'ı saran <label>'a tıklamak gerekiyor.
    await page.locator('label').filter({ hasText: /^Mavi$/ }).click();

    // Marka filtresi uygulanınca ya "?wb=" query param'lı ya da "mavi-..." SEO slug'lı URL'ye gidiliyor.
    await expect(page).toHaveURL(/([?&]wb=)|(\/mavi-)/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Mavi');
  });

  test('5) Fiyata göre artan sıralama uygulanabiliyor', async ({ page }) => {
    await page.goto(SEARCH_URL);
    await closePopupsIfAny(page);

    await page.getByRole('button', { name: /Sıralama/ }).click();
    await page.getByRole('option', { name: 'En Düşük Fiyat' }).click();

    await expect(page).toHaveURL(/sst=PRICE_BY_ASC/);
    await expect(page.getByRole('button', { name: /En Düşük Fiyat/ })).toBeVisible();
  });

  test('6) Bir ürün kartına tıklayınca ürün detay sayfası açılıyor', async ({ page }) => {
    await page.goto(SEARCH_URL);
    await closePopupsIfAny(page);

    // Ürün kartları yeni sekmede açılıyor.
    const firstProductLink = page.getByRole('heading', { level: 2 }).first().locator('..');
    const [detailPage] = await Promise.all([
      page.context().waitForEvent('page'),
      firstProductLink.click(),
    ]);
    await detailPage.waitForLoadState();

    await expect(detailPage).toHaveURL(/-p-\d+/);
    await expect(detailPage.getByRole('heading', { level: 1 })).toBeVisible();

    await detailPage.close();
  });
});
