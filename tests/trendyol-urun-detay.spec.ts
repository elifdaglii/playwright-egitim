import { test, expect, Page } from '@playwright/test';

const SEARCH_URL = 'https://www.trendyol.com/sr?q=elbise';

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

// Ürün kartları yeni sekmede açılıyor; ilk ürüne tıklayıp açılan sekmeyi döndürür.
async function openFirstProductDetail(page: Page) {
  await page.goto(SEARCH_URL);
  await closePopupsIfAny(page);

  const firstProductLink = page.getByRole('heading', { level: 2 }).first().locator('..');
  const [detailPage] = await Promise.all([
    page.context().waitForEvent('page'),
    firstProductLink.click(),
  ]);
  await detailPage.waitForLoadState();
  return detailPage;
}

test.describe('Trendyol ürün detay sayfası', () => {
  test('bir ürün kartına tıklayınca ürün detay sayfası açılıyor', async ({ page }) => {
    const detailPage = await openFirstProductDetail(page);

    await expect(detailPage).toHaveURL(/-p-\d+/);
    await expect(detailPage.getByRole('heading', { level: 1 })).toBeVisible();

    await detailPage.close();
  });

  test('detay sayfasında ürün başlığı, fiyatı ve görseli görünüyor', async ({ page }) => {
    const detailPage = await openFirstProductDetail(page);

    await expect(detailPage.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(detailPage.getByText(/\d+([.,]\d+)?\s*TL/).first()).toBeVisible();
    // Ürün galerisindeki görseller "<ürün adı> - 1", "- 2" ... şeklinde alt metne sahip.
    await expect(detailPage.locator('img[alt$="- 1"]').first()).toBeVisible();

    await detailPage.close();
  });

  test('detay sayfasında değerlendirme/yorum bilgisi görünüyor', async ({ page }) => {
    const detailPage = await openFirstProductDetail(page);

    await expect(detailPage.getByText(/Değerlendirme/).first()).toBeVisible();

    await detailPage.close();
  });

  test('detay sayfasında Sepete Ekle butonu görünür ve tıklanabilir', async ({ page }) => {
    const detailPage = await openFirstProductDetail(page);

    const addToCartButton = detailPage.getByRole('button', { name: /Sepete Ekle/ });
    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();

    await detailPage.close();
  });
});
